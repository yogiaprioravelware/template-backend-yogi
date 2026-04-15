const { 
  OutboundLog, 
  sequelize 
} = require("../../models");
const logger = require("../../utils/logger");

/**
 * Tahap Kedua Outbound (Staging)
 * Scan RFID di staging area. Update status 'STAGED', catat staging_time.
 * @param {string} rfidTag 
 * @returns {Promise<Object>}
 */
const scanRfidStaging = async (rfidTag) => {
  logger.info(`Scan Staging - RFID: ${rfidTag}`);
  
  let transaction;
  try {
    transaction = await sequelize.transaction();
    // Find the log where it is picked
    const log = await OutboundLog.findOne({
      where: { rfid_tag: rfidTag, status: "PICKED" },
      transaction
    });

    if (!log) {
      const err = new Error("RFID tag not in PICKED status or not found for any active outbound order");
      err.status = 400;
      throw err;
    }

    log.status = "STAGED";
    log.staging_time = new Date();
    await log.save({ transaction });

    await transaction.commit();

    return {
      message: "Item berhasil dimasukkan ke staging area",
      rfid_tag: rfidTag,
      status: "STAGED"
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Staging failed: ${err.message}`);
    throw err;
  }
};

module.exports = { scanRfidStaging };
