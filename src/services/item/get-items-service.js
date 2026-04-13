const Item = require("../../models/Item");
const Location = require("../../models/Location");
const logger = require("../../utils/logger");

const getItems = async () => {
  logger.info("Fetching all items from the database");
  const items = await Item.findAll({
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
    order: [["created_at", "DESC"]],
  });
  logger.info(`Found ${items.length} items`);
  return items;
};

module.exports = getItems;