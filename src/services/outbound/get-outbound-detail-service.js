const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const logger = require("../../utils/logger");

// Service untuk mengambil detail outbound dengan items-nya
const getOutboundDetail = async (outboundId) => {
  logger.info(`Fetching details for outbound ID: ${outboundId}`);
  const outbound = await Outbound.findByPk(outboundId);
  if (!outbound) {
    logger.warn(`Outbound with ID: ${outboundId} not found`);
    const err = new Error("Outbound not found");
    err.status = 400;
    throw err;
  }

  const outboundItems = await OutboundItem.findAll({
    where: { outbound_id: outboundId },
    attributes: ["id", "sku_code", "qty_target", "qty_delivered"],
  });
  logger.info(`Found ${outboundItems.length} items for outbound ID: ${outboundId}`);

  // Tambahkan informasi item dari tabel items
  const itemsWithDetails = await Promise.all(
    outboundItems.map(async (item) => {
      const itemDetail = await Item.findOne({
        where: { sku_code: item.sku_code },
        attributes: ["item_name", "category", "uom", "current_stock"],
      });
      return {
        ...item.dataValues,
        item_name: itemDetail?.item_name || "",
        category: itemDetail?.category || "",
        uom: itemDetail?.uom || "",
        current_stock: itemDetail?.current_stock || 0,
      };
    })
  );

  return {
    ...outbound.dataValues,
    items: itemsWithDetails,
  };
};

module.exports = getOutboundDetail;