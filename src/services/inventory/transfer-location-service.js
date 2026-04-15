const { Item, Location, ItemLocation, InventoryMovement, sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation");

/**
 * Melakukan transfer stok internal antar lokasi untuk item tertentu.
 * Memastikan ketersediaan stok di lokasi sumber dan validitas lokasi tujuan.
 * Mencatat mutasi keluar dari sumber dan mutasi masuk ke tujuan.
 * @param {Object} payload 
 * @returns {Promise<Object>}
 */
const transferLocation = async (payload) => {
  logger.info(`Attempting internal transfer with payload: ${JSON.stringify(payload)}`);
  
  const { item_id, from_location_id, to_location_id, qty } = payload;

  if (from_location_id === to_location_id) {
    const err = new Error("Source and destination locations cannot be the same");
    err.status = 400;
    throw err;
  }

  const transaction = await sequelize.transaction();
  
  try {
    const item = await Item.findByPk(item_id, { transaction });
    if (!item) {
      const err = new Error("Item not found");
      err.status = 404;
      throw err;
    }

    // Validate locations are active
    const fromLoc = await Location.findByPk(from_location_id, { transaction });
    const toLoc = await Location.findByPk(to_location_id, { transaction });

    if (!fromLoc || fromLoc.status !== "ACTIVE") {
      const err = new Error("Source location not found or inactive");
      err.status = 400;
      throw err;
    }
    if (!toLoc || toLoc.status !== "ACTIVE") {
      const err = new Error("Destination location not found or inactive");
      err.status = 400;
      throw err;
    }

    // Ensure sufficient stock in source
    const sourceItemLoc = await ItemLocation.findOne({
      where: { item_id, location_id: from_location_id },
      transaction,
    });

    if (!sourceItemLoc || sourceItemLoc.stock < qty) {
      const available = sourceItemLoc ? sourceItemLoc.stock : 0;
      const err = new Error(`Insufficient stock in source location (${fromLoc.location_code}). Available: ${available}, Requested: ${qty}`);
      err.status = 400;
      throw err;
    }

    // Process Transfer
    // 1. Deduct from Source
    sourceItemLoc.stock -= qty;
    
    if (sourceItemLoc.stock === 0) {
      await sourceItemLoc.destroy({ transaction });
      logger.info(`Source location ${fromLoc.location_code} emptied and record removed for item ${item.sku_code}`);
    } else {
      await sourceItemLoc.save({ transaction });
    }

    await InventoryMovement.create({
      item_id,
      location_id: from_location_id,
      type: "INTERNAL_TRANSFER_OUT",
      qty_change: -qty,
      balance_after: sourceItemLoc.stock,
      reference_id: `TRF-${Date.now()}`,
      operator_name: "SYSTEM",
    }, { transaction });

    // 2. Add to Destination
    let destItemLoc = await ItemLocation.findOne({
      where: { item_id, location_id: to_location_id },
      transaction,
    });

    if (destItemLoc) {
      destItemLoc.stock += qty;
      await destItemLoc.save({ transaction });
    } else {
      destItemLoc = await ItemLocation.create({
        item_id,
        location_id: to_location_id,
        stock: qty
      }, { transaction });
    }

    await InventoryMovement.create({
      item_id,
      location_id: to_location_id,
      type: "INTERNAL_TRANSFER_IN",
      qty_change: qty,
      balance_after: destItemLoc.stock,
      reference_id: `TRF-${Date.now()}`,
      operator_name: "SYSTEM",
    }, { transaction });

    // Recalculate global current_stock to ensure integrity
    await reconcileItemStock(item.id, transaction);

    await transaction.commit();
    logger.info(`Successfully transferred ${qty} of item ${item.sku_code} from ${fromLoc.location_code} to ${toLoc.location_code}`);

    return {
      message: "Transfer successful",
      item: {
        sku_code: item.sku_code,
        item_name: item.item_name,
      },
      transfer_details: {
        qty,
        from: fromLoc.location_code,
        to: toLoc.location_code
      }
    };
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Transfer failed: ${err.message}`);
    throw err;
  }
};

module.exports = transferLocation;
