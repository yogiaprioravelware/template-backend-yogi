const Joi = require("joi");
const { isValidEPC } = require("../utils/rfid-validator");

const createInboundSchema = Joi.object({
  po_number: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        sku_code: Joi.string().required(),
        qty_target: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

const scanRfidReceivedSchema = Joi.object({
  rfid_tag: Joi.string().required().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  }),
  location_id: Joi.number().integer().required(),
});

const scanQrStoredSchema = Joi.object({
  qr_string: Joi.string().required(),
  rfid_tag: Joi.string().required().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  })
});

module.exports = {
  createInboundSchema,
  scanRfidReceivedSchema,
  scanQrStoredSchema,
};
