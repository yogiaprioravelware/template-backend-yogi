const { Item, ItemLocation, sequelize } = require("../models");
const logger = require("./logger");

/**
 * Recalculates the global current_stock for an item based on the sum of all its location stocks.
 * This is the 'Self-Healing' mechanism to prevent data drift.
 * 
 * @param {number} itemId - The ID of the item to reconcile
 * @param {object} transaction - The Sequelize transaction object
 */
const reconcileItemStock = async (itemId, transaction) => {
  try {
    logger.info(`Starting auto-reconciliation for item_id: ${itemId}`);
    
    // Sum all stocks for this item across all locations
    const totalStock = await ItemLocation.sum("stock", {
      where: { item_id: itemId },
      transaction,
    }) || 0;

    // Update the item's global current_stock
    const item = await Item.findByPk(itemId, { transaction });
    if (item) {
      const oldStock = item.current_stock;
      item.current_stock = totalStock;
      await item.save({ transaction });
      
      if (oldStock === totalStock) {
        logger.info(`Stock for item ${item.sku_code} is already in sync (${totalStock}).`);
      } else {
        logger.warn(`Stock drift detected for item ${item.sku_code}. Old global stock: ${oldStock}, New calculated stock: ${totalStock}. Data reconciled.`);
      }
    }

    return totalStock;
  } catch (error) {
    logger.error(`Reconciliation failed for item_id ${itemId}: ${error.message}`);
    throw error;
  }
};

module.exports = { reconcileItemStock };
