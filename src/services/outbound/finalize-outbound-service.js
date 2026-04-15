const { 
  Outbound, 
  OutboundItem, 
  OutboundLog, 
  Item, 
  ItemLocation, 
  InventoryMovement,
  sequelize 
} = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");

/**
 * Helper to process a single staged log during finalization.
 * Reduces cognitive complexity of finalizeOutbound.
 */
const processStagedLog = async (log, outbound, userId, transaction) => {
  const item = await Item.findOne({ where: { rfid_tag: log.rfid_tag }, transaction });
  if (!item) return;

  // Update OutboundItem delivered qty
  const outboundItem = await OutboundItem.findOne({
    where: { outbound_id: outbound.id, sku_code: item.sku_code },
    transaction
  });

  if (outboundItem) {
    outboundItem.qty_delivered += 1;
    await outboundItem.save({ transaction });
  }

  // Deduct stock from the pick location
  const itemLoc = await ItemLocation.findOne({
    where: { item_id: item.id, location_id: log.location_id },
    transaction
  });

  if (itemLoc) {
    itemLoc.stock -= 1;
    const balanceAfter = itemLoc.stock;
    
    if (itemLoc.stock <= 0) {
      await itemLoc.destroy({ transaction });
    } else {
      await itemLoc.save({ transaction });
    }

    // Record Movement
    await InventoryMovement.create({
      item_id: item.id,
      location_id: log.location_id,
      type: "OUTBOUND",
      qty_change: -1,
      balance_after: balanceAfter,
      reference_id: outbound.order_number,
      operator_name: userId ? `USER_${userId}` : "SYSTEM",
    }, { transaction });

    // Reconciliation
    await reconcileItemStock(item.id, transaction);
  }

  // Update Log status to FINALIZED
  log.status = "FINALIZED";
  await log.save({ transaction });
};

/**
 * Tahap Terakhir Outbound (Finalize)
 * Mengonfirmasi seluruh barang yang sudah di-stage untuk dikirim.
 * Melakukan pengurangan stok fisik, pencatatan mutasi, dan penyelesaian dokumen.
 * @param {number} outboundId 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const finalizeOutbound = async (outboundId, userId) => {
  logger.info(`Finalizing Outbound Order: ${outboundId}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const outbound = await Outbound.findByPk(outboundId, {
      include: [{ model: OutboundItem, as: "items" }],
      transaction
    });

    if (!outbound) {
      const err = new Error("Outbound order not found");
      err.status = 404;
      throw err;
    }

    if (outbound.status === "DONE") {
      const err = new Error("Order is already finalized (DONE)");
      err.status = 400;
      throw err;
    }

    // Ambil log yang sudah di-STAGED
    const stagedLogs = await OutboundLog.findAll({
      where: { outbound_id: outboundId, status: "STAGED" },
      transaction
    });

    if (stagedLogs.length === 0) {
      const err = new Error("No items in STAGED status. Please perform picking and staging first.");
      err.status = 400;
      throw err;
    }

    // Proses setiap item yang di-stage
    for (const log of stagedLogs) {
      await processStagedLog(log, outbound, userId, transaction);
    }

    // Update Outbound status
    // Check if fully fulfilled
    const updatedOrderItems = await OutboundItem.findAll({
      where: { outbound_id: outboundId },
      transaction
    });
    
    const isFullyFulfilled = updatedOrderItems.every(item => item.qty_delivered >= item.qty_target);
    
    outbound.status = isFullyFulfilled ? "DONE" : "PROCESS";
    await outbound.save({ transaction });

    await transaction.commit();

    return {
      message: "Outbound order finalized successfully",
      order_number: outbound.order_number,
      status: outbound.status,
      items_processed: stagedLogs.length,
      digital_document: {
        order_number: outbound.order_number,
        customer_name: outbound.customer_name,
        finalization_date: new Date(),
        items: updatedOrderItems.map(item => ({
          sku_code: item.sku_code,
          qty_target: item.qty_target,
          qty_delivered: item.qty_delivered
        }))
      }
    };

  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Outbound finalization failed: ${error.message}`);
    throw error;
  }
};

module.exports = { finalizeOutbound };
