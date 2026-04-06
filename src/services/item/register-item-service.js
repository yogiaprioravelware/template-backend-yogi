const Item = require("../../models/Item");
const { registerItemSchema } = require("../../validations/item-validation");
const logger = require("../../utils/logger");

// Service untuk registrasi item baru
const registerItem = async (itemData) => {
  logger.info("Attempting to register a new item");
  const { error } = registerItemSchema.validate(itemData);
  if (error) {
    logger.warn(`Validation error during item registration: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { rfid_tag, sku_code } = itemData;

  // Check RFID tag sudah ada atau tidak
  const existingRfid = await Item.findOne({ where: { rfid_tag } });
  if (existingRfid) {
    logger.warn(`Registration failed: RFID tag ${rfid_tag} already registered`);
    const err = new Error("RFID tag already registered");
    err.status = 400;
    throw err;
  }

  // Check SKU code sudah ada atau tidak
  const existingSku = await Item.findOne({ where: { sku_code } });
  if (existingSku) {
    logger.warn(`Registration failed: SKU code ${sku_code} already registered`);
    const err = new Error("SKU code already registered");
    err.status = 400;
    throw err;
  }

  const item = await Item.create(itemData);
  logger.info(`Item with SKU ${sku_code} registered successfully`);
  // Return item dengan attributes yang jelas
  return item.dataValues;
};

module.exports = registerItem;