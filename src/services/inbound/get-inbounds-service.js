const sequelize = require("../../utils/database");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const logger = require("../../utils/logger");

const getInbounds = async () => {
  logger.info("Fetching all inbounds with summarized stats");
  const inbounds = await Inbound.findAll({
    attributes: ["id", "po_number", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
    raw: true
  });

  const stats = await InboundItem.findAll({
    attributes: [
      "inbound_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "item_count"],
      [sequelize.fn("SUM", sequelize.col("qty_target")), "total_qty_target"],
      [sequelize.fn("SUM", sequelize.col("qty_received")), "total_qty_received"],
    ],
    group: ["inbound_id"],
    raw: true
  });

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr.inbound_id] = curr;
    return acc;
  }, {});

  const result = inbounds.map((inbound) => {
    const s = statsMap[inbound.id] || {};
    const totalTarget = parseInt(s.total_qty_target || 0);
    const totalReceived = parseInt(s.total_qty_received || 0);
    
    return {
      ...inbound,
      item_count: parseInt(s.item_count || 0),
      total_qty_target: totalTarget,
      total_qty_received: totalReceived,
      progress_percentage: totalTarget > 0 ? Math.round((totalReceived / totalTarget) * 100) : 0
    };
  });

  logger.info(`Found ${result.length} inbounds`);
  return result;
};

module.exports = { getInbounds };