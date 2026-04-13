const Item = require("../../models/Item");
const Location = require("../../models/Location");
const ItemLocation = require("../../models/ItemLocation");
const InventoryMovement = require("../../models/InventoryMovement");
const { transferLocationSchema } = require("../../validations/inventory-validation");
const sequelize = require("../../utils/database");
const logger = require("../../utils/logger");
const { reconcileItemStock } = require("../../utils/reconciliation"); // Added

const transferLocation = async (payload) => {
  logger.info(`Attempting internal transfer with payload: ${JSON.stringify(payload)}`);
  
  const { error } = transferLocationSchema.validate(payload);
  if (error) {
    logger.warn(`Transfer validation error: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { item_id, from_location_id, to_location_id, qty } = payload;

  if (from_location_id === to_location_id) {
    const err = new Error("Source and destination locations cannot be the same");
    err.status = 400;
    throw err;
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();
    // Validate Item
    const item = await Item.findByPk(item_id, { transaction });
    if (!item) {
      const err = new Error("Item not found");
      err.status = 404;
      throw err;
    }

    // Validate Locations
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

    // Validate Source ItemLocation
    const sourceItemLoc = await ItemLocation.findOne({
      where: { item_id, location_id: from_location_id },
      transaction,
    });

    if (!sourceItemLoc || sourceItemLoc.stock < qty) {
      const err = new Error(`Insufficient stock in source location (${fromLoc.location_code}). Available: ${sourceItemLoc ? sourceItemLoc.stock : 0}, Requested: ${qty}`);
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

    // 3. SELF-HEALING: Recalculate global current_stock from all locations
    // Internal transfer shouldn't change the total mathematically, but this ensures integrity
    await reconcileItemStock(item.id, transaction);

    await transaction.commit();
    logger.info(`Successfully transferred ${qty} of item ${item.sku_code} from ${fromLoc.location_code} to ${toLoc.location_code}`);

    return {
      message: "Transfer berhasil",
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
