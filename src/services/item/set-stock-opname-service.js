const Item = require("../../models/Item");
const Location = require("../../models/Location");
const ItemLocation = require("../../models/ItemLocation");
const InventoryMovement = require("../../models/InventoryMovement");
const sequelize = require("../../utils/database");
const logger = require("../../utils/logger");

const setStockOpname = async (payload, userId) => {
  const { item_id, location_id, actual_qty, notes } = payload;
  logger.info(`Starting Stock Opname for item_id: ${item_id} at location_id: ${location_id}. Actual Qty: ${actual_qty}`);

  const transaction = await sequelize.transaction();

  try {
    const item = await Item.findByPk(item_id, { transaction });
    if (!item) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }

    const location = await Location.findByPk(location_id, { transaction });
    if (!location) {
      const error = new Error("Location not found");
      error.status = 404;
      throw error;
    }

    // Find the item location stock mapping
    let itemLocation = await ItemLocation.findOne({
      where: { item_id, location_id },
      transaction,
    });

    let currentStock = 0;
    if (itemLocation) {
      currentStock = itemLocation.stock;
    } else {
      // If none exists but we are declaring stock via opname, we create it.
      itemLocation = await ItemLocation.create({
        item_id,
        location_id,
        stock: 0
      }, { transaction });
    }

    const qtyChange = actual_qty - currentStock;

    // Update item location stock
    itemLocation.stock = actual_qty;
    await itemLocation.save({ transaction });

    // Update global item stock (difference)
    item.current_stock = item.current_stock + qtyChange;
    await item.save({ transaction });

    // Create Inventory Movement Log
    const refNo = notes ? `OPNAME - ${notes}` : `OPNAME-${Date.now()}`;
    await InventoryMovement.create({
      item_id,
      location_id,
      type: "STOCK_OPNAME",
      qty_change: qtyChange,
      balance_after: actual_qty,
      reference_id: refNo,
      operator_name: userId || "SYSTEM", // Usually mapped by auth
    }, { transaction });

    await transaction.commit();
    logger.info(`Stock Opname completed. Variance: ${qtyChange}`);
    
    return { 
      message: "Stock Opname applied successfully", 
      deviation: qtyChange,
      new_stock: actual_qty 
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Stock Opname failed: ${error.message}`);
    throw error;
  }
};

module.exports = setStockOpname;
