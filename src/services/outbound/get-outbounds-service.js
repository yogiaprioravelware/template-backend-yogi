const sequelize = require("../../utils/database");
const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const logger = require("../../utils/logger");

const getOutbounds = async () => {
  logger.info("Fetching all outbounds with summarized stats");
  const outbounds = await Outbound.findAll({
    attributes: ["id", "order_number", "outbound_type", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
    raw: true
  });

  const stats = await OutboundItem.findAll({
    attributes: [
      "outbound_id",
      [sequelize.fn("COUNT", sequelize.col("id")), "item_count"],
      [sequelize.fn("SUM", sequelize.col("qty_target")), "total_qty_target"],
      [sequelize.fn("SUM", sequelize.col("qty_delivered")), "total_qty_delivered"],
    ],
    group: ["outbound_id"],
    raw: true
  });

  const statsMap = stats.reduce((acc, curr) => {
    acc[curr.outbound_id] = curr;
    return acc;
  }, {});

  const result = outbounds.map((outbound) => {
    const s = statsMap[outbound.id] || {};
    const totalTarget = parseInt(s.total_qty_target || 0);
    const totalDelivered = parseInt(s.total_qty_delivered || 0);

    return {
      ...outbound,
      item_count: parseInt(s.item_count || 0),
      total_qty_target: totalTarget,
      total_qty_delivered: totalDelivered,
      progress_percentage: totalTarget > 0 ? Math.round((totalDelivered / totalTarget) * 100) : 0
    };
  });

  logger.info(`Found ${result.length} outbounds`);
  return result;
};

module.exports = getOutbounds;