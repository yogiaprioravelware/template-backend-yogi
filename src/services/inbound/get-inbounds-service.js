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
      const itemCount = await InboundItem.count({
        where: { inbound_id: inbound.id },
      });
      return {
        ...inbound.dataValues,
        item_count: itemCount,
      };
    })
  );
  logger.info(`Found ${result.length} inbounds`);
  return result;
};

module.exports = { getInbounds };