const Joi = require("joi");
const { isValidEPC } = require("../utils/rfid-validator");

const createOutboundSchema = Joi.object({
  order_number: Joi.string().required(),
  outbound_type: Joi.string().valid("LUNAS", "PINJAM", "RETURN").required(),
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

const scanQrPickingSchema = Joi.object({
  rfid_tag: Joi.string().required().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  }),
  qr_string: Joi.string().required(),
});

const scanRfidStagingSchema = Joi.object({
  rfid_tag: Joi.string().required().custom((value, helpers) => {
    if (!isValidEPC(value)) {
      return helpers.message("Invalid RFID format. Must be a 24-character SGTIN-96 Hexadecimal string starting with '30'");
    }
    return value;
  }),
});

module.exports = {
  createOutboundSchema,
  scanQrPickingSchema,
  scanRfidStagingSchema,
};
