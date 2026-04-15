const { Item } = require("../../models");
const logger = require("../../utils/logger");
const { isValidEPC } = require("../../utils/rfid-validator");

/**
 * Updates an existing item's profile data.
 * @param {number} id 
 * @param {Object} itemData 
 * @returns {Promise<Object>}
 */
const updateItem = async (id, itemData) => {
  logger.info(`Attempting to update item with id: ${id}`);
  
  if (itemData.rfid_tag && !isValidEPC(itemData.rfid_tag)) {
    const err = new Error("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    err.status = 400;
    throw err;
  }

  const item = await Item.findByPk(id);
  if (!item) {
    logger.warn(`Update failed: Item with id ${id} not found`);
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }

  // Check RFID uniqueness if changed
  if (itemData.rfid_tag && itemData.rfid_tag !== item.rfid_tag) {
    const existingRfid = await Item.findOne({ where: { rfid_tag: itemData.rfid_tag } });
    if (existingRfid) {
      logger.warn(`Update failed: RFID tag ${itemData.rfid_tag} already in use`);
      const err = new Error("RFID tag already in use");
      err.status = 400;
      throw err;
    }
  }

  // Check SKU uniqueness if changed
  if (itemData.sku_code && itemData.sku_code !== item.sku_code) {
    const existingSku = await Item.findOne({ where: { sku_code: itemData.sku_code } });
    if (existingSku) {
      logger.warn(`Update failed: SKU code ${itemData.sku_code} already in use`);
      const err = new Error("SKU code already in use");
      err.status = 400;
      throw err;
    }
  }

  await item.update(itemData);
  logger.info(`Item with id: ${id} updated successfully`);
  
  return item;
};

module.exports = updateItem;