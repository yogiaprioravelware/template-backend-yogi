const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const Item = require("../../models/Item");
const logger = require("../../utils/logger");

// Service untuk mengambil detail inbound dengan items-nya
const getInboundDetail = async (inboundId) => {
  logger.info(`Fetching inbound detail for id: ${inboundId}`);
  const inbound = await Inbound.findByPk(inboundId);
  if (!inbound) {
    logger.warn(`Inbound with id: ${inboundId} not found`);
    const err = new Error("Inbound not found");
    err.status = 400;
    throw err;
  }

  const inboundItems = await InboundItem.findAll({
    where: { inbound_id: inboundId },
    attributes: ["id", "sku_code", "qty_target", "qty_received"],
  });

  // Tambahkan informasi item dari tabel items
  const itemsWithDetails = await Promise.all(
    inboundItems.map(async (item) => {
      const itemDetail = await Item.findOne({
        where: { sku_code: item.sku_code },
        attributes: ["item_name", "category", "uom"],
      });
      return {
        ...item.dataValues,
        item_name: itemDetail?.item_name || "",
        category: itemDetail?.category || "",
        uom: itemDetail?.uom || "",
      };
    })
  );
  logger.info(`Found ${itemsWithDetails.length} items for inbound id: ${inboundId}`);
  return {
    ...inbound.dataValues,
    items: itemsWithDetails,
  };
};

module.exports = { getInboundDetail };