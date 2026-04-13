const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const ItemLocation = require("../../models/ItemLocation");
const InventoryMovement = require("../../models/InventoryMovement");
const locationModel = require("../../models/Location");
const { scanRfidSchema } = require("../../validations/outbound-validation");
const logger = require("../../utils/logger");
const sequelize = require("../../utils/database");
const { reconcileItemStock } = require("../../utils/reconciliation");

const scanRfidPicking = async (outboundId, rfidData) => {
  logger.info(`Scanning RFID for picking. Outbound ID: ${outboundId}, RFID: ${rfidData.rfid_tag}`);
  
  const { error } = scanRfidSchema.validate(rfidData);
  if (error) {
    logger.warn(`Validation failed for RFID picking: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { rfid_tag, location_qr } = rfidData;
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const outbound = await Outbound.findByPk(outboundId, { transaction });
    if (!outbound) {
      logger.warn(`Outbound not found for ID: ${outboundId}`);
      const err = new Error("Outbound not found");
      err.status = 400;
      throw err;
    }

    if (outbound.status === "DONE") {
      logger.warn(`Picking failed: Outbound ${outboundId} is already DONE`);
      const err = new Error("Outbound is already DONE, cannot pick more items");
      err.status = 400;
      throw err;
    }

    const loc = await locationModel.findOne({ 
      where: { qr_string: location_qr },
      transaction 
    });
    
    if (loc?.status !== "ACTIVE") {
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
      err.status = 400;
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

    const allOutboundItems = await OutboundItem.findAll({
      where: { outbound_id: outboundId },
      transaction
    });

    const allComplete = allOutboundItems.every((item) => item.qty_delivered >= item.qty_target);

    if (allComplete) {
      outbound.status = "DONE";
      await outbound.save({ transaction });
    } else if (outbound.status === "PENDING") {
      outbound.status = "PROCES";
      await outbound.save({ transaction });
    }

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