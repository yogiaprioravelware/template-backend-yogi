const Item = require("../../models/Item");
const Location = require("../../models/Location");
const InventoryMovement = require("../../models/InventoryMovement");
const logger = require("../../utils/logger");

const getItemHistory = async (itemId) => {
  logger.info(`Fetching inventory movement history for item id: ${itemId}`);
  
  const item = await Item.findByPk(itemId);
  if (!item) {
    const error = new Error("Item not found");
    error.status = 404;
    throw error;
  }

  const movements = await InventoryMovement.findAll({
    where: { item_id: itemId },
    include: [
      {
        model: Location,
        as: "location",
        attributes: ["id", "location_name", "warehouse", "rack", "bin"],
      }
    ],
    order: [["created_at", "DESC"]],
  });

  return movements;
};

module.exports = getItemHistory;
