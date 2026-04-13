const { Op } = require("sequelize");
const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const { createOutboundSchema } = require("../../validations/outbound-validation");
const logger = require("../../utils/logger");

/**
 * Service to create a new outbound order
 */
const createOutbound = async (outboundData) => {
  logger.info("Attempting to create a new outbound order");
  const { error } = createOutboundSchema.validate(outboundData);
  if (error) {
    logger.warn(`Validation error during outbound order creation: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { order_number, outbound_type, items } = outboundData;

  const existingOrder = await Outbound.findOne({ where: { order_number } });
  if (existingOrder) {
    logger.warn(`Creation failed: Order number ${order_number} already exists`);
    const err = new Error("Order number already exists");
    err.status = 400;
    throw err;
  }

  // Validate all SKUs exist using bulk query
  const skuCodes = items.map(item => item.sku_code);
  const existingItems = await Item.findAll({
    where: { sku_code: { [Op.in]: skuCodes } }
  });

  if (existingItems.length !== skuCodes.length) {
    const foundSkus = existingItems.map(i => i.sku_code);
    const missingSkus = skuCodes.filter(sku => !foundSkus.includes(sku));
    logger.warn(`Creation failed: SKU codes not found: ${missingSkus.join(", ")}`);
    const err = new Error(`The following SKU codes were not found: ${missingSkus.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const outbound = await Outbound.create({
    order_number,
    outbound_type,
    status: "PENDING",
  });
  logger.info(`Outbound header created for order number: ${order_number}`);

  await OutboundItem.bulkCreate(items.map(item => ({
    outbound_id: outbound.id,
    sku_code: item.sku_code,
    qty_target: item.qty_target,
    qty_delivered: 0,
  })));
  logger.info(`Outbound items created for order number: ${order_number}`);

  return outbound;
};

module.exports = createOutbound;