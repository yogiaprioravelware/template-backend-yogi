const { Item, Location, ItemLocation, sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { isValidEPC } = require("../../utils/rfid-validator");

/**
 * Mendaftarkan item baru ke sistem dan menginisialisasi stok di lokasi tertentu.
 * @param {Object} itemData 
 * @returns {Promise<Object>}
 */
const registerItem = async (itemData) => {
  logger.info("Attempting to register a new item with location support");
  
  // Custom EPC validation remains in service as it's a domain requirement
  if (!isValidEPC(itemData.rfid_tag)) {
    const err = new Error("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    err.status = 400;
    throw err;
  }

  const { rfid_tag, sku_code, location_id, current_stock } = itemData;

  const transaction = await sequelize.transaction();

  try {
    const existingRfid = await Item.findOne({ where: { rfid_tag }, transaction });
    if (existingRfid) {
      const err = new Error("RFID tag already registered");
      err.status = 400;
      throw err;
    }

    const existingSku = await Item.findOne({ where: { sku_code }, transaction });
    if (existingSku) {
      const err = new Error("SKU code already registered");
      err.status = 400;
      throw err;
    }

    const item = await Item.create(itemData, { transaction });

    if (current_stock > 0) {
      let targetLocationId = location_id;

      if (!targetLocationId) {
        const receivingArea = await Location.findOne({ 
          where: { location_code: 'RECEIVING-01' },
          transaction 
        });
        
        if (receivingArea) {
          targetLocationId = receivingArea.id;
          logger.info(`Assigning item ${sku_code} to default Receiving Area`);
        } else {
          logger.warn("Receiving Area not found, stock remains headless (not recommended)");
        }
      }

      if (targetLocationId) {
        await ItemLocation.create({
          item_id: item.id,
          location_id: targetLocationId,
          stock: current_stock
        }, { transaction });
      }
    }

    await transaction.commit();
    logger.info(`Item with SKU ${sku_code} registered and located successfully`);
    
    return item.toJSON();
  } catch (err) {
    if (transaction) await transaction.rollback();
    logger.error(`Registration failed: ${err.message}`);
    throw err;
  }
};

module.exports = registerItem;