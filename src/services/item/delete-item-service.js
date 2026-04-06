const Item = require("../../models/Item");
const logger = require("../../utils/logger");

// Service untuk menghapus item
const deleteItem = async (id) => {
  logger.info(`Attempting to delete item with id: ${id}`);
  const item = await Item.findByPk(id);
  if (!item) {
    logger.warn(`Deletion failed: Item with id ${id} not found`);
    const err = new Error("Item not found");
    err.status = 400;
    throw err;
  }

  await item.destroy();
  logger.info(`Item with id: ${id} deleted successfully`);
  return { message: "Item deleted successfully" };
};

module.exports = deleteItem;