const { 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  InventoryMovement, 
  Location,
  sequelize 
} = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");
const { handleAutomatedStaging } = require("../staging/automated-staging-service");

/**
 * Memproses pengambilan (picking) item berdasarkan scan RFID dan lokasi.
 * Melakukan pemutakhiran stok, pencatatan mutasi, dan memicu proses staging otomatis.
 * @param {number} outboundId 
 * @param {Object} rfidData 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const scanRfidPicking = async (outboundId, rfidData, userId = 1) => {
  logger.info(`Scanning RFID for picking. Outbound ID: ${outboundId}, RFID: ${rfidData.rfid_tag}`);
  
  const { rfid_tag, location_qr } = rfidData;

  const transaction = await sequelize.transaction();
  try {
    const outbound = await Outbound.findByPk(outboundId, { transaction });
    if (!outbound) {
      logger.warn(`Outbound not found for ID: ${outboundId}`);
      const err = new Error("Outbound not found");
      err.status = 404;
      throw err;
    }

    if (outbound.status === "DONE") {
      logger.warn(`Picking failed: Outbound ${outboundId} is already DONE`);
      const err = new Error("Outbound is already DONE, cannot pick more items");
      err.status = 400;
      throw err;
    }

    const loc = await Location.findOne({ 
      where: { qr_string: location_qr },
      transaction 
    });
    
    if (!loc || loc.status !== "ACTIVE") {
      logger.warn(`Picking failed: Location with QR ${location_qr} not found or inactive`);
      const err = new Error("Location not found or inactive");
      err.status = 400;
      throw err;
    }

    const scannedItem = await Item.findOne({ 
      where: { rfid_tag }, 
      transaction 
    });
    
    if (!scannedItem) {
      logger.warn(`RFID tag not found in system: ${rfid_tag}`);
      const err = new Error("RFID tag not found in system");
      err.status = 404;
      throw err;
    }

    const outboundItem = await OutboundItem.findOne({
      where: {
        outbound_id: outboundId,
        sku_code: scannedItem.sku_code,
      },
      transaction
    });

    if (!outboundItem) {
      logger.warn(`SKU ${scannedItem.sku_code} not found in outbound order ${outboundId}`);
      const err = new Error(`SKU ${scannedItem.sku_code} is not in this order`);
      err.status = 400;
      throw err;
    }

    if (outboundItem.qty_delivered >= outboundItem.qty_target) {
      logger.warn(`Target quantity for SKU ${scannedItem.sku_code} already met in outbound ${outboundId}`);
      const err = new Error(`SKU ${scannedItem.sku_code} already reached target (${outboundItem.qty_target})`);
      err.status = 400;
      throw err;
    }

    const itemLoc = await ItemLocation.findOne({
      where: { item_id: scannedItem.id, location_id: loc.id },
      transaction
    });

    if (!itemLoc || itemLoc.stock <= 0) {
      logger.warn(`Item ${scannedItem.sku_code} stock is empty in location ${loc.location_code}`);
      const err = new Error(`Stock in location ${loc.location_code} is empty for this item`);
      err.status = 400;
      throw err;
    }

    // Process picking
    outboundItem.qty_delivered += 1;
    await outboundItem.save({ transaction });

    itemLoc.stock -= 1;
    const balanceAfterLoc = itemLoc.stock;
    
    if (itemLoc.stock === 0) {
      await itemLoc.destroy({ transaction });
    } else {
      await itemLoc.save({ transaction });
    }

    await reconcileItemStock(scannedItem.id, transaction);

    await InventoryMovement.create({
      item_id: scannedItem.id,
      location_id: loc.id,
      type: "OUTBOUND",
      qty_change: -1,
      balance_after: balanceAfterLoc,
      reference_id: outbound.order_number,
      operator_name: "SYSTEM",
    }, { transaction });

    // --- AUTOMATED STAGING HOOK ---
    await handleAutomatedStaging(
      rfid_tag, 
      outboundId, 
      loc.id, 
      userId, 
      transaction, 
      outboundItem.id
    );

    const allOutboundItems = await OutboundItem.findAll({
      where: { outbound_id: outboundId },
      transaction
    });

    const allComplete = allOutboundItems.every((item) => item.qty_delivered >= item.qty_target);

    if (allComplete) {
      outbound.status = "DONE";
    } else if (outbound.status === "PENDING") {
      outbound.status = "PROCES";
    }
    await outbound.save({ transaction });

    await transaction.commit();
    logger.info(`Picking successful for RFID ${rfid_tag}. Transaction committed.`);

    return {
      message: "Item picked successfully",
      scanned_item: {
        rfid_tag: scannedItem.rfid_tag,
        item_name: scannedItem.item_name,
        sku_code: scannedItem.sku_code,
      },
      outbound_item_status: {
        sku_code: outboundItem.sku_code,
        qty_delivered: outboundItem.qty_delivered,
        qty_target: outboundItem.qty_target,
      },
      outbound_status: outbound.status,
      outbound_type: outbound.outbound_type,
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Picking failed: ${err.message}`);
    throw err;
  }
};

module.exports = scanRfidPicking;