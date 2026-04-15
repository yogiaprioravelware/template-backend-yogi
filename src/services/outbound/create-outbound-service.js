const { Outbound, OutboundItem, sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { validateSkusExist } = require("../../utils/item-validator");

/**
 * Creates a new outbound order along with its items.
 * Ensures order number uniqueness and validates SKU existence.
 * @param {Object} outboundData 
 * @returns {Promise<Object>}
 */
const createOutbound = async (outboundData) => {
  logger.info("Attempting to create a new outbound order");
  
  const { order_number, outbound_type, items } = outboundData;

  const transaction = await sequelize.transaction();
  try {
    const existingOrder = await Outbound.findOne({ where: { order_number }, transaction });
    if (existingOrder) {
      logger.warn(`Creation failed: Order number ${order_number} already exists`);
      const err = new Error("Order number already exists");
      err.status = 400;
      throw err;
    }

    await validateSkusExist(items);

    const outbound = await Outbound.create({
      order_number,
      outbound_type,
      status: "PENDING",
    }, { transaction });

    logger.info(`Outbound header created for order number: ${order_number}`);

    await OutboundItem.bulkCreate(items.map(item => ({
      outbound_id: outbound.id,
      sku_code: item.sku_code,
      qty_target: item.qty_target,
      qty_delivered: 0,
    })), { transaction });

    logger.info(`Outbound items created for order number: ${order_number}`);

    await transaction.commit();
    return outbound;
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Outbound order creation failed: ${error.message}`);
    throw error;
  }
};

module.exports = createOutbound;