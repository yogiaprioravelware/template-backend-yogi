const { Op } = require("sequelize");
const Inbound = require("../../models/Inbound");
const InboundItem = require("../../models/InboundItem");
const Item = require("../../models/Item");
const logger = require("../../utils/logger");

const getInboundDetail = async (inboundId) => {
  logger.info(`Fetching inbound detail for id: ${inboundId}`);
  const inbound = await Inbound.findByPk(inboundId);
  if (!inbound) {
    logger.warn(`Inbound with id: ${inboundId} not found`);
    const err = new Error("Inbound PO not found");
    err.status = 400;
    throw err;
  }

  const inboundItems = await InboundItem.findAll({
    where: { inbound_id: inboundId },
    attributes: ["id", "sku_code", "qty_target", "qty_received"],
    raw: true
  });

  const skuCodes = inboundItems.map(item => item.sku_code);
  const itemsMetadata = await Item.findAll({
    where: { sku_code: { [Op.in]: skuCodes } },
    attributes: ["sku_code", "item_name", "category", "uom"],
    raw: true
  });

  const metadataMap = itemsMetadata.reduce((acc, current) => {
    acc[current.sku_code] = current;
    return acc;
  }, {});

  const itemsWithDetails = inboundItems.map(item => {
    const meta = metadataMap[item.sku_code];
    return {
      ...item,
      item_name: meta?.item_name || "",
      category: meta?.category || "",
      uom: meta?.uom || "",
    };
  });

  logger.info(`Found ${itemsWithDetails.length} items for inbound id: ${inboundId}`);
  return {
    ...inbound.dataValues,
    items: itemsWithDetails,
  };
};

module.exports = { getInboundDetail };