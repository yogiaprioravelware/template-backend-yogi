const Joi = require("joi");

const createLocationSchema = Joi.object({
  location_code: Joi.string().required(),
  qr_string: Joi.string().required(),
  warehouse: Joi.string().required(),
  rack: Joi.string().required(),
  bin: Joi.string().required(),
  location_name: Joi.string().optional(),
});

const updateLocationSchema = Joi.object({
  location_code: Joi.string().optional(),
  qr_string: Joi.string().optional(),
  warehouse: Joi.string().optional(),
  rack: Joi.string().optional(),
  bin: Joi.string().optional(),
  location_name: Joi.string().optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
};
