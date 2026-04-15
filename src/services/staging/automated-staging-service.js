const { StagingSession, StagingItem, StagingAuditLog, Op } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Secara otomatis mencatat item yang telah di-pick ke dalam sesi staging.
 * Dipicu oleh proses Outbound Picking.
 * @param {string} rfidTag 
 * @param {number} outboundId 
 * @param {number} locId 
 * @param {number} userId 
 * @param {Object} transaction - Transaction object from caller
 * @param {number} outboundItemId 
 * @returns {Promise<Object>}
 */
const handleAutomatedStaging = async (rfidTag, outboundId, locId, userId, transaction, outboundItemId) => {
  logger.info(`Processing automated staging for RFID: ${rfidTag}, Outbound: ${outboundId}`);

  // 1. Find or Create an OPEN staging session specifically for this outbound order
  let session = await StagingSession.findOne({
    where: { 
      status: "OPEN",
      session_number: { [Op.like]: `%ORD-${outboundId}%` }
    },
    transaction
  });

  if (!session) {
    session = await StagingSession.create({
      session_number: `AUTO-STG-ORD-${outboundId}-${Date.now().toString().slice(-4)}`,
      status: "OPEN",
    }, { transaction });

    await StagingAuditLog.create({
      staging_session_id: session.id,
      user_id: userId,
      action: "AUTO_CREATE",
      details: { reason: "Outbound Pick Trigger", order_id: outboundId },
    }, { transaction });
  }

  // 2. Create Staging Item entry
  const stagingItem = await StagingItem.create({
    staging_session_id: session.id,
    rfid_tag: rfidTag,
    outbound_item_id: outboundItemId,
    location_id: locId,
    status: "STAGED",
  }, { transaction });

  return stagingItem;
};

module.exports = { handleAutomatedStaging };
