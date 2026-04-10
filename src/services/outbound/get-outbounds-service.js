const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const logger = require("../../utils/logger");

// Service untuk mengambil semua outbound dengan count items
const getOutbounds = async () => {
  logger.info("Fetching all outbounds from the database");
  const outbounds = await Outbound.findAll({
    attributes: ["id", "order_number", "outbound_type", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
  });

  // Tambah info jumlah items per outbound
  const result = await Promise.all(
    outbounds.map(async (outbound) => {
      const [itemCount, totalTarget, totalDelivered] = await Promise.all([
        OutboundItem.count({ where: { outbound_id: outbound.id } }),
        OutboundItem.sum('qty_target', { where: { outbound_id: outbound.id } }),
        OutboundItem.sum('qty_delivered', { where: { outbound_id: outbound.id } })
      ]);

      return {
        ...outbound.dataValues,
        item_count: itemCount,
        total_qty_target: totalTarget || 0,
        total_qty_delivered: totalDelivered || 0,
        progress_percentage: totalTarget > 0 ? Math.round((totalDelivered / totalTarget) * 100) : 0
      };
    })
  );
  logger.info(`Found ${result.length} outbounds`);
  return result;
};

module.exports = getOutbounds;