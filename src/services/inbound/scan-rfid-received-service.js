const { Item, Inbound, InboundItem, Location, InboundLog, sequelize } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Tahap Pertama (Received Area)
 * Scan RFID dan sertakan location di 'received area'.
 * Endpoint scan pertama hanya menerima RFID tag dan menandai status "RECEIVED"
 * @param {number} inboundId 
 * @param {string} rfidTag 
 * @param {number} locationId
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const scanRfidReceived = async (inboundId, rfidTag, locationId, userId) => {
  logger.info(`Scan Received Area - RFID: ${rfidTag}, Inbound: ${inboundId}, Location: ${locationId}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const inbound = await Inbound.findByPk(inboundId, { transaction });
    if (!inbound) {
      const error = new Error("Inbound PO not found");
      error.status = 404;
      throw error;
    }

    if (inbound.status === "DONE") {
      const error = new Error("Inbound PO is already completed");
      error.status = 400;
      throw error;
    }

    const item = await Item.findOne({ where: { rfid_tag: rfidTag }, transaction });
    if (!item) {
      const error = new Error("RFID tag not found in system");
      error.status = 404;
      throw error;
    }

    const inboundItem = await InboundItem.findOne({
      where: { inbound_id: inboundId, sku_code: item.sku_code },
      transaction,
    });

    if (!inboundItem) {
      const error = new Error(`SKU ${item.sku_code} is not in this PO`);
      error.status = 400;
      throw error;
    }

    // Check if this specific item (RFID) has already been received
    const existingLog = await InboundLog.findOne({
      where: { rfid_tag: rfidTag },
      transaction
    });

    if (existingLog) {
      const error = new Error("Item with this RFID has already been received/stored");
      error.status = 400;
      throw error;
    }

    if (inboundItem.qty_received >= inboundItem.qty_target) {
      const error = new Error("Item target quantity already completed");
      error.status = 400;
      throw error;
    }

    // Validate location (Received Area)
    const location = await Location.findByPk(locationId, { transaction });
    if (!location) {
      const error = new Error("Location not found");
      error.status = 404;
      throw error;
    }

    // Increment received
    inboundItem.qty_received += 1;
    await inboundItem.save({ transaction });

    // Mark PO as PROCESS if pending
    if (inbound.status === "PENDING") {
      inbound.status = "PROCESS";
      await inbound.save({ transaction });
    }

    // Log to InboundLog
    await InboundLog.create({
      rfid_tag: rfidTag,
      status: "RECEIVED",
      user_id: userId || null,
      area: location.location_name || location.location_code,
      location_id: location.id,
    }, { transaction });

    await transaction.commit();

    return {
      message: "Item berhasil diterima di area penerimaan",
      rfid_tag: rfidTag,
      inbound_item: {
        id: inboundItem.id,
        sku_code: inboundItem.sku_code,
        qty_target: inboundItem.qty_target,
        qty_received: inboundItem.qty_received,
      },
      status: "RECEIVED"
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Error in scanRfidReceived: ${error.message}`);
    throw error;
  }
};

module.exports = { scanRfidReceived };
