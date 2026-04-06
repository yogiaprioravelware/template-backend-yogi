const Item = require("../../models/Item");
const { updateItemSchema } = require("../../validations/item-validation");
const logger = require("../../utils/logger");

// Service untuk memperbarui data item
const updateItem = async (id, itemData) => {
  logger.info(`Attempting to update item with id: ${id}`);
  const { error } = updateItemSchema.validate(itemData);
  if (error) {
    logger.warn(`Validation error during item update: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
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

  // Check RFID tag jika diubah
  if (itemData.rfid_tag && itemData.rfid_tag !== item.rfid_tag) {
    const existingRfid = await Item.findOne({ where: { rfid_tag: itemData.rfid_tag } });
    if (existingRfid) {
      logger.warn(`Update failed: RFID tag ${itemData.rfid_tag} already in use`);
      const err = new Error("RFID tag already in use");
      err.status = 400;
      throw err;
    }
  }

  // Check SKU code jika diubah
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