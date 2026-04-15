const { Inbound, InboundItem, InboundLog, Item, sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");

/**
 * Tahap Terakhir Inbound (Finalize)
 * Mengonfirmasi seluruh barang yang sudah di-store di rak.
 * Melakukan rekonsiliasi stok global dan menyelesaikan dokumen PO.
 * @param {number} inboundId 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const finalizeInbound = async (inboundId, userId) => {
  logger.info(`Finalizing Inbound PO: ${inboundId}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const inbound = await Inbound.findByPk(inboundId, {
      include: [{ model: InboundItem, as: "items" }],
      transaction
    });

    if (!inbound) {
      const err = new Error("Inbound PO not found");
      err.status = 404;
      throw err;
    }

    if (inbound.status === "DONE") {
      const err = new Error("Inbound PO is already finalized (DONE)");
      err.status = 400;
      throw err;
    }

    // Ambil log yang sudah di-STORED
    const storedLogs = await InboundLog.findAll({
      where: { inbound_id: inboundId, status: "STORED" },
      transaction
    });

    if (storedLogs.length === 0) {
      const err = new Error("No items in STORED status. Please scan items to rack first.");
      err.status = 400;
      throw err;
    }

    // Identifikasi SKU/Item unik yang perlu direkonsiliasi
    const processedRfids = storedLogs.map(log => log.rfid_tag);
    const affectedItems = await Item.findAll({
      where: { rfid_tag: processedRfids },
      transaction
    });

    const uniqueItemIds = [...new Set(affectedItems.map(item => item.id))];

    // Mark logs as FINALIZED
    for (const log of storedLogs) {
      log.status = "FINALIZED";
      await log.save({ transaction });
    }

    // Mark PO as DONE
    inbound.status = "DONE";
    await inbound.save({ transaction });

    // Rekonsiliasi stok global untuk setiap item yang terlibat
    for (const itemId of uniqueItemIds) {
      await reconcileItemStock(itemId, transaction);
    }

    await transaction.commit();

    return {
      message: "Inbound PO finalized successfully",
      po_number: inbound.po_number,
      status: inbound.status,
      items_processed: storedLogs.length,
      digital_document: {
        po_number: inbound.po_number,
        finalization_date: new Date(),
        items: inbound.items.map(item => ({
          sku_code: item.sku_code,
          qty_target: item.qty_target,
          qty_received: item.qty_received
        }))
      }
    };

  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Inbound finalization failed: ${error.message}`);
    throw error;
  }
};

module.exports = { finalizeInbound };
