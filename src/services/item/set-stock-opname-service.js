const { Item, Location, ItemLocation, InventoryMovement, sequelize } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Melakukan Stock Opname (penyelesaian selisih stok) untuk item tertentu di lokasi tertentu.
 * Mencatat riwayat mutasi sebagai STOCK_OPNAME.
 * @param {Object} payload 
 * @param {string|number} userId 
 * @returns {Promise<Object>}
 */
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

    let itemLocation = await ItemLocation.findOne({
      where: { item_id, location_id },
      transaction,
    });

    let currentStock = 0;
    if (itemLocation) {
      currentStock = itemLocation.stock;
    } else {
      itemLocation = await ItemLocation.create({
        item_id,
        location_id,
        stock: 0
      }, { transaction });
    }

    const qtyChange = actual_qty - currentStock;

    itemLocation.stock = actual_qty;
    await itemLocation.save({ transaction });

    // Recalculate total item stock across all locations
    const totalStock = await ItemLocation.sum('stock', { 
      where: { item_id },
      transaction 
    });
    
    item.current_stock = totalStock;
    await item.save({ transaction });

    const refNo = notes ? `OPNAME - ${notes}` : `OPNAME-${Date.now()}`;
    await InventoryMovement.create({
      item_id,
      location_id,
      type: "STOCK_OPNAME",
      qty_change: qtyChange,
      balance_after: actual_qty,
      reference_id: refNo,
      operator_name: userId || "SYSTEM",
    }, { transaction });

    await transaction.commit();
    logger.info(`Stock Opname completed. Variance: ${qtyChange}`);
    
    return { 
      message: "Stock Opname applied successfully", 
      deviation: qtyChange,
      new_stock: actual_qty 
    };
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error(`Stock Opname failed: ${error.message}`);
    throw error;
  }
};

module.exports = setStockOpname;
