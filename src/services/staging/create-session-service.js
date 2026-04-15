const { StagingSession, StagingAuditLog, sequelize } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Membuat sesi staging baru untuk proses outbound.
 * @param {Object} sessionData 
 * @param {number} userId 
 * @returns {Promise<Object>}
 */
const createSession = async (sessionData, userId) => {
  logger.info(`Creating a new staging session: ${sessionData.session_number}`);
  
  const transaction = await sequelize.transaction();
  try {
    // Check if session number already exists
    const existing = await StagingSession.findOne({
      where: { session_number: sessionData.session_number },
      transaction
    });

    if (existing) {
      const err = new Error("Session number already exists");
      err.status = 400;
      throw err;
    }

    const session = await StagingSession.create({
      session_number: sessionData.session_number,
      status: "OPEN",
      created_by_id: userId,
    }, { transaction });

    await StagingAuditLog.create({
      staging_session_id: session.id,
      user_id: userId,
      action: "CREATE",
      details: { session_number: session.session_number },
    }, { transaction });

    await transaction.commit();
    return session;
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Failed to create staging session: ${err.message}`);
    throw err;
  }
};

module.exports = createSession;
