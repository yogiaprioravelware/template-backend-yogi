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
      const itemCount = await OutboundItem.count({
        where: { outbound_id: outbound.id },
      });
      return {
        ...outbound.dataValues,
        item_count: itemCount,
      };
    })
  );
  logger.info(`Found ${result.length} outbounds`);
  return result;
};

module.exports = getOutbounds;