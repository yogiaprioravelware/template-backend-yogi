const { Op } = require("sequelize");
const Item = require("../models/Item");
const logger = require("./logger");

/**
 * Validates that all SKU codes in the provided items array exist in the system.
 * Uses Set for efficient existence checking as recommended by best practices.
 * 
 * @param {Array} items - Array of objects containing sku_code
 * @throws {Error} if any SKU code is not found
 */
const validateSkusExist = async (items) => {
  const skuCodes = [...new Set(items.map(item => item.sku_code))];
  
  const existingItems = await Item.findAll({
    where: { sku_code: { [Op.in]: skuCodes } },
    attributes: ["sku_code"],
    raw: true
  });

  if (existingItems.length !== skuCodes.length) {
    const foundSkus = new Set(existingItems.map(i => i.sku_code));
    const missingSkus = skuCodes.filter(sku => !foundSkus.has(sku));
    
    logger.warn(`SKU validation failed. Missing: ${missingSkus.join(", ")}`);
    const err = new Error(`The following SKU codes were not found: ${missingSkus.join(", ")}`);
    err.status = 400;
    throw err;
  }
};

module.exports = {
  validateSkusExist
};
