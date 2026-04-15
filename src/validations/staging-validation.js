const Joi = require("joi");

const createSessionSchema = Joi.object({
  session_number: Joi.string().max(100).required(),
});

const addStagingItemSchema = Joi.object({
  rfid_tag: Joi.string().required(),
  location_qr: Joi.string().required(),
});

module.exports = {
  createSessionSchema,
  addStagingItemSchema,
};
