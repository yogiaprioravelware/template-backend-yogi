const { Item, Location, InboundLog, ItemLocation, InventoryMovement, sequelize } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Tahap Kedua (Pindah ke Rak)
 * Endpoint scan QR lokasi rak dan RFID.
 * Validasi QR aktif, update inbound_logs, dan update item_locations.
 * @param {string} qrString 
 * @param {string} rfidTag 
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const scanQrStored = async (qrString, rfidTag, userId) => {
  logger.info(`Scan Stored Area - QR: ${qrString}, RFID: ${rfidTag}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const location = await Location.findOne({
      where: { qr_string: qrString },
      transaction,
    });

    if (!location) {
      const error = new Error("Location QR code not found");
      error.status = 404;
      throw error;
    }

    if (location.status !== "ACTIVE") {
      const error = new Error("Location is inactive for storage");
      error.status = 400;
      throw error;
    }

    const item = await Item.findOne({ where: { rfid_tag: rfidTag }, transaction });
    if (!item) {
      const error = new Error("RFID tag not found in system");
      error.status = 404;
      throw error;
    }

    // Check if the item is in RECEIVED status
    const inboundLog = await InboundLog.findOne({
      where: { rfid_tag: rfidTag, status: "RECEIVED" },
      transaction
    });

    if (!inboundLog) {
      const error = new Error("Item has not been received or is already stored.");
      error.status = 400;
      throw error;
    }

    // Update inbound_logs to STORED
    inboundLog.status = "STORED";
    inboundLog.location_id = location.id;
    inboundLog.user_id = userId; // Override user to whoever stored it
    await inboundLog.save({ transaction });

    // Update or Insert into item_locations
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

    // Insert into inventory_movements
    await InventoryMovement.create({
      item_id: item.id,
      location_id: location.id,
      type: "INBOUND_STORED",
      qty_change: 1,
      balance_after: itemLoc.stock,
      reference_id: `INBOUND_LOG_${inboundLog.id}`,
      operator_name: userId ? `USER_${userId}` : "SYSTEM",
    }, { transaction });

    await transaction.commit();

    return {
      message: "Item berhasil dipindahkan ke rak penyimpanan",
      rfid_tag: rfidTag,
      location: {
        id: location.id,
        location_code: location.location_code,
        qr_string: location.qr_string,
        warehouse: location.warehouse,
      },
      status: "STORED"
    };

  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Error in scanQrStored: ${error.message}`);
    throw error;
  }
};

module.exports = { scanQrStored };
