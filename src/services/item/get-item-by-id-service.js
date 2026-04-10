const Item = require("../../models/Item");
const Location = require("../../models/Location");
const logger = require("../../utils/logger");

// Service untuk mengambil item berdasarkan ID
const getItemById = async (id) => {
  logger.info(`Fetching item with id: ${id}`);
  const item = await Item.findByPk(id, {
    attributes: [
      "id",
      "rfid_tag",
      "item_name",
      "sku_code",
      "category",
      "uom",
      "current_stock",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: Location,
        as: "locations",
      },
    ],
  });
  if (!item) {
    logger.warn(`Item with id: ${id} not found`);
    const err = new Error("Item not found");
    err.status = 400;
    throw err;
  }
  logger.info(`Item with id: ${id} found`);
  return item;
};

module.exports = getItemById;