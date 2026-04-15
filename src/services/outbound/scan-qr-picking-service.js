const { 
  Outbound, 
  OutboundItem, 
  Item, 
  ItemLocation, 
  Location,
  OutboundLog,
  sequelize 
} = require("../../models");
const logger = require("../../utils/logger");

/**
 * Tahap Pertama Outbound (Picking)
 * Scan QR lokasi untuk validasi lokasi pick benar, setelah valid scan RFID barang.
 * Update status 'PICKED' di outbound_logs.
 * @param {number} outboundId 
 * @param {string} qrString 
 * @param {string} rfidTag 
 * @returns {Promise<Object>}
 */
const scanQrPicking = async (outboundId, qrString, rfidTag) => {
  logger.info(`Scan Picking - Outbound: ${outboundId}, QR: ${qrString}, RFID: ${rfidTag}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const outbound = await Outbound.findByPk(outboundId, { transaction });
    if (!outbound) {
      const err = new Error("Outbound not found");
      err.status = 404;
      throw err;
    }

    if (outbound.status === "DONE") {
      const err = new Error("Outbound is already DONE");
      err.status = 400;
      throw err;
    }

    const loc = await Location.findOne({ 
      where: { qr_string: qrString },
      transaction 
    });
    
    if (loc?.status !== "ACTIVE") {
      const err = new Error("Location not found or inactive");
      err.status = 400;
      throw err;
    }

    const item = await Item.findOne({ 
      where: { rfid_tag: rfidTag }, 
      transaction 
    });
    
    if (!item) {
      const err = new Error("RFID tag not found in system");
      err.status = 404;
      throw err;
    }

    const outboundItem = await OutboundItem.findOne({
      where: {
        outbound_id: outboundId,
        sku_code: item.sku_code,
      },
      transaction
    });

    if (!outboundItem) {
      const err = new Error(`SKU ${item.sku_code} is not in this order`);
      err.status = 400;
      throw err;
    }

    // Check if the item has already been picked for this outbound
    const existingLog = await OutboundLog.findOne({
      where: { rfid_tag: rfidTag, outbound_id: outboundId },
      transaction
    });

    if (existingLog) {
      const err = new Error("Item with this RFID has already been picked or staged for this order");
      err.status = 400;
      throw err;
    }

    // Actually we need the count of picked items for this particular SKU to compare against qty_target.
    // Wait, OutboundLog does not store SKU, but we can find it via Items.
    // Let's do a simple Item query to get all RFIDs picked so far for this order to check by SKU.
    const allLogsForOrder = await OutboundLog.findAll({
      where: { outbound_id: outboundId },
      transaction
    });

    const pickedRfidTags = allLogsForOrder.map(log => log.rfid_tag);
    if (pickedRfidTags.length > 0) {
      const pickedItems = await Item.findAll({
        where: { rfid_tag: pickedRfidTags, sku_code: item.sku_code },
        transaction
      });
      if (pickedItems.length >= outboundItem.qty_target) {
        const err = new Error(`SKU ${item.sku_code} already reached target (${outboundItem.qty_target})`);
        err.status = 400;
        throw err;
      }
    }

    const itemLoc = await ItemLocation.findOne({
      where: { item_id: item.id, location_id: loc.id },
      transaction
    });

    if (!itemLoc || itemLoc.stock <= 0) {
      const err = new Error(`Stock in location ${loc.location_code} is empty for this item`);
      err.status = 400;
      throw err;
    }

    // Mark as PICKED
    await OutboundLog.create({
      outbound_id: outboundId,
      rfid_tag: rfidTag,
      status: "PICKED",
      location_id: loc.id
    }, { transaction });

    if (outbound.status === "PENDING") {
      outbound.status = "PROCESS";
      await outbound.save({ transaction });
    }

    await transaction.commit();

    return {
      message: "Item berhasil dipick dari lokasi",
      rfid_tag: rfidTag,
      status: "PICKED"
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Picking failed: ${err.message}`);
    throw err;
  }
};

module.exports = { scanQrPicking };
