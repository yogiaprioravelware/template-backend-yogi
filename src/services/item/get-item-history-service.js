const Item = require("../../models/Item");
const Location = require("../../models/Location");
const InventoryMovement = require("../../models/InventoryMovement");
const logger = require("../../utils/logger");

const getItemHistory = async (itemId) => {
  logger.info(`Fetching inventory movement history for item id: ${itemId}`);
  
  const item = await Item.findByPk(itemId);
  if (!item) {
    throw { status: 404, message: "Item not found" };
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
