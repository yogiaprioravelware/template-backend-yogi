const { 
  Item, 
  Location, 
  Inbound, 
  InboundItem, 
  InboundReceivingLog, 
  InventoryMovement, 
  ItemLocation,
  sequelize 
} = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");

/**
 * Mendaftarkan penerimaan item inbound ke lokasi tertentu di gudang.
 * Memperbarui stok item, mencatat log penerimaan, mutasi inventori,
 * dan memperbarui status dokumen inbound jika seluruh item telah diterima.
 * @param {number} inboundId 
 * @param {number} inboundItemId 
 * @param {string} qrString 
 * @returns {Promise<Object>}
 */
const setLocation = async (inboundId, inboundItemId, qrString) => {
  logger.info(`Setting location for inbound item ${inboundItemId} in inbound ${inboundId} with QR string: ${qrString}`);
  
  const transaction = await sequelize.transaction();
  try {
    const location = await Location.findOne({
      where: { qr_string: qrString },
      transaction,
    });

    if (!location) {
      logger.warn(`Set location failed: Location with QR string ${qrString} not found`);
      const error = new Error("Location QR code not found");
      error.status = 404;
      throw error;
    }

    if (location.status !== "ACTIVE") {
      logger.warn(`Set location failed: Location ${location.location_code} is inactive`);
      const error = new Error("Location is inactive for receiving");
      error.status = 400;
      throw error;
    }

    const inbound = await Inbound.findByPk(inboundId, { transaction });
    if (!inbound) {
      logger.warn(`Set location failed: Inbound with id ${inboundId} not found`);
      const error = new Error("Inbound PO not found");
      error.status = 404;
      throw error;
    }

    const inboundItem = await InboundItem.findOne({
      where: {
        id: inboundItemId,
        inbound_id: inboundId,
      },
      transaction,
    });

    if (!inboundItem) {
      logger.warn(`Set location failed: Inbound item with id ${inboundItemId} not found in inbound ${inboundId}`);
      const error = new Error("Item not found in this PO");
      error.status = 404;
      throw error;
    }

    if (inboundItem.qty_received >= inboundItem.qty_target) {
      logger.warn(`Set location failed: Quantity for inbound item ${inboundItemId} already completed`);
      const error = new Error("Item target quantity already completed");
      error.status = 400;
      throw error;
    }

    // Process receiving
    inboundItem.qty_received += 1;
    await inboundItem.save({ transaction });
    
    await InboundReceivingLog.create({
      inbound_item_id: inboundItem.id,
      location_id: location.id,
      qty_received: 1,
    }, { transaction });

    const item = await Item.findOne({
      where: { sku_code: inboundItem.sku_code },
      transaction,
    });

    if (item) {
      let itemLoc = await ItemLocation.findOne({
        where: { item_id: item.id, location_id: location.id },
        transaction,
      });

      if (itemLoc) {
        itemLoc.stock += 1;
        await itemLoc.save({ transaction });
      } else {
        itemLoc = await ItemLocation.create({
          item_id: item.id,
          location_id: location.id,
          stock: 1
        }, { transaction });
      }

      await reconcileItemStock(item.id, transaction);

      await InventoryMovement.create({
        item_id: item.id,
        location_id: location.id,
        type: "INBOUND",
        qty_change: 1,
        balance_after: itemLoc.stock,
        reference_id: inbound.po_number,
        operator_name: "SYSTEM",
      }, { transaction });
    }

    const allInboundItems = await InboundItem.findAll({
      where: { inbound_id: inboundId },
      transaction,
    });

    const allComplete = allInboundItems.every(
      (ii) => ii.qty_received >= ii.qty_target
    );

    // Update inbound status
    if (allComplete) {
      inbound.status = "DONE";
    } else if (inbound.status === "PENDING") {
      inbound.status = "PROCES";
    }
    await inbound.save({ transaction });

    await transaction.commit();

    const completedCount = allInboundItems.filter(
      (ii) => ii.qty_received >= ii.qty_target
    ).length;

    return {
      message: "Item received successfully",
      location: {
        id: location.id,
        location_code: location.location_code,
        qr_string: location.qr_string,
        warehouse: location.warehouse,
        rack: location.rack,
        bin: location.bin,
        location_name: location.location_name,
      },
      inbound_item: {
        id: inboundItem.id,
        sku_code: inboundItem.sku_code,
        qty_target: inboundItem.qty_target,
        qty_received: inboundItem.qty_received,
        qty_remaining: inboundItem.qty_target - inboundItem.qty_received,
      },
      inbound_progress: {
        po_number: inbound.po_number,
        status: inbound.status,
        total_items: allInboundItems.length,
        completed_items: completedCount,
        progress_percentage: Math.round(
          (completedCount / allInboundItems.length) * 100
        ),
      },
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Error setting location for inbound ${inboundId}: ${error.message}`);
    throw error;
  }
};

module.exports = { setLocation };
