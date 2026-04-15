const { 
  StagingSession, 
  StagingItem, 
  StagingAuditLog, 
  OutboundItem, 
  Outbound, 
  Item, 
  Location, 
  User 
} = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil detail sesi staging beserta item yang terdaftar dan log audit.
 * Menggunakan Eager Loading untuk efisiensi query.
 * @param {number} sessionId 
 * @returns {Promise<Object>}
 */
const getSessionDetail = async (sessionId) => {
  logger.info(`Fetching details for staging session: ${sessionId}`);
  
  const session = await StagingSession.findByPk(sessionId, {
    include: [
      {
        model: StagingItem,
        as: "items",
        include: [
          {
            model: OutboundItem,
            as: "outbound_item",
            include: [{ model: Outbound, as: "outbound" }]
          },
          {
            model: Location,
            as: "location"
          }
        ]
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!session) {
    const err = new Error("Staging session not found");
    err.status = 404;
    throw err;
  }

  // Fetch audit logs separately to keep them ordered
  const auditLogs = await StagingAuditLog.findAll({
    where: { staging_session_id: sessionId },
    include: [{ model: User, as: "user", attributes: ["name"] }],
    order: [["created_at", "DESC"]]
  });

  // Since we don't have a direct association from StagingItem to Item (it's via rfid_tag/sku_code logic usually),
  // we might need to enrich the items array with item names manually if not associated.
  // Assuming associations exist in models/index.js as per my earlier refactoring.
  
  return {
    session,
    audit_logs: auditLogs
  };
};

/**
 * Mengambil daftar seluruh sesi staging dengan dukungan pagination.
 * @param {number} page 
 * @param {number} limit 
 * @returns {Promise<Object>}
 */
const getStagingSessions = async (page = 1, limit = 10) => {
  logger.info("Fetching staging sessions with pagination");
  const offset = (page - 1) * limit;

  const { count, rows } = await StagingSession.findAndCountAll({
    include: [{ model: User, as: "creator", attributes: ["name"] }],
    order: [["created_at", "DESC"]],
    limit,
    offset
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

module.exports = {
  getSessionDetail,
  getStagingSessions
};
