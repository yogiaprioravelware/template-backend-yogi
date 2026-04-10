const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const Item = require("../../models/Item");
const logger = require("../../utils/logger");

// Service untuk mengambil semua inbound dengan count items
const getInbounds = async () => {
  logger.info("Fetching all inbounds from the database");
  const inbounds = await Inbound.findAll({
    attributes: ["id", "po_number", "status", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
  });

  // Tambah info jumlah items per inbound
  const result = await Promise.all(
    inbounds.map(async (inbound) => {
      const [itemCount, totalTarget, totalReceived] = await Promise.all([
        InboundItem.count({ where: { inbound_id: inbound.id } }),
        InboundItem.sum('qty_target', { where: { inbound_id: inbound.id } }),
        InboundItem.sum('qty_received', { where: { inbound_id: inbound.id } })
      ]);
      
      return {
        ...inbound.dataValues,
        item_count: itemCount,
        total_qty_target: totalTarget || 0,
        total_qty_received: totalReceived || 0,
        progress_percentage: totalTarget > 0 ? Math.round((totalReceived / totalTarget) * 100) : 0
      };
    })
  );
  logger.info(`Found ${result.length} inbounds`);
  return result;
};

module.exports = { getInbounds };