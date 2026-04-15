const { Item, Location } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Fetch item details by ID along with its locations.
 * @param {number} id 
 * @returns {Promise<Object>}
 */
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
        through: { attributes: ["stock"] },
      },
    ],
  });
  if (!item) {
    logger.warn(`Item with id: ${id} not found`);
    const err = new Error("Item not found");
    err.status = 404;
    throw err;
  }
  logger.info(`Item with id: ${id} found`);
  return item;
};

module.exports = getItemById;