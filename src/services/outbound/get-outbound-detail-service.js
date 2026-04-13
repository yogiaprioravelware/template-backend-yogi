const { Op } = require("sequelize");
const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const logger = require("../../utils/logger");

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
    raw: true
  });

  const skuCodes = outboundItems.map(item => item.sku_code);
  const itemsMetadata = await Item.findAll({
    where: { sku_code: { [Op.in]: skuCodes } },
    attributes: ["sku_code", "item_name", "category", "uom", "current_stock"],
    raw: true
  });

  const metadataMap = itemsMetadata.reduce((acc, current) => {
    acc[current.sku_code] = current;
    return acc;
  }, {});

  const itemsWithDetails = outboundItems.map(item => {
    const meta = metadataMap[item.sku_code];
    return {
      ...item,
      item_name: meta?.item_name || "",
      category: meta?.category || "",
      uom: meta?.uom || "",
      current_stock: meta?.current_stock || 0,
    };
  });

  logger.info(`Found ${itemsWithDetails.length} items for outbound ID: ${outboundId}`);
  return {
    ...outbound.dataValues,
    items: itemsWithDetails,
  };
};

module.exports = getOutboundDetail;