const Joi = require("joi");
const { isValidEPC } = require("../utils/rfid-validator");

const registerItemSchema = Joi.object({
  rfid_tag: Joi.string().required().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  }),
  item_name: Joi.string().min(3).required(),
  sku_code: Joi.string().min(3).required(),
  category: Joi.string().required(),
  uom: Joi.string().valid("PCS", "BOX", "SET").required(),
  current_stock: Joi.number().integer().min(0).required(),
  location_id: Joi.number().integer().allow(null).optional(), // If null, system will try to use Receiving Area
});

const updateItemSchema = Joi.object({
  rfid_tag: Joi.string().optional().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  }),
  item_name: Joi.string().min(3).optional(),
  sku_code: Joi.string().min(3).optional(),
  category: Joi.string().optional(),
  uom: Joi.string().valid("PCS", "BOX", "SET").optional(),
  current_stock: Joi.number().integer().min(0).optional(),
});

module.exports = {
  registerItemSchema,
  updateItemSchema,
};
