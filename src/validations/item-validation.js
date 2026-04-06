const Joi = require("joi");

const registerItemSchema = Joi.object({
  rfid_tag: Joi.string().required(),
  item_name: Joi.string().min(3).required(),
  sku_code: Joi.string().min(3).required(),
  category: Joi.string().required(),
  uom: Joi.string().valid("PCS", "BOX", "SET").required(),
  current_stock: Joi.number().integer().min(0).required(),
});

const updateItemSchema = Joi.object({
  rfid_tag: Joi.string().optional(),
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
