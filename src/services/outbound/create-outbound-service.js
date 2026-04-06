const Outbound = require("../../models/Outbound");
const OutboundItem = require("../../models/OutboundItem");
const Item = require("../../models/Item");
const { createOutboundSchema } = require("../../validations/outbound-validation");
const logger = require("../../utils/logger");

// Service untuk membuat order outbound baru
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

  // Check order number sudah ada atau tidak
  const existingOrder = await Outbound.findOne({ where: { order_number } });
  if (existingOrder) {
    logger.warn(`Creation failed: Order number ${order_number} already exists`);
    const err = new Error("Order number already exists");
    err.status = 400;
    throw err;
  }

  // Create outbound header
  const outbound = await Outbound.create({
    order_number,
    outbound_type,
    status: "PENDING",
  });
  logger.info(`Outbound header created for order number: ${order_number}`);

  // Validate all SKU codes exist in items table
  for (const item of items) {
    const existingItem = await Item.findOne({ where: { sku_code: item.sku_code } });
    if (!existingItem) {
      logger.warn(`Creation failed: SKU code ${item.sku_code} not found in items`);
      const err = new Error(`SKU code ${item.sku_code} not found in items`);
      err.status = 400;
      throw err;
    }
  }

  // Create outbound items (detail)
  for (const item of items) {
    await OutboundItem.create({
      outbound_id: outbound.id,
      sku_code: item.sku_code,
      qty_target: item.qty_target,
      qty_delivered: 0,
    });
  }
  logger.info(`Outbound items created for order number: ${order_number}`);

  return outbound;
};

module.exports = createOutbound;