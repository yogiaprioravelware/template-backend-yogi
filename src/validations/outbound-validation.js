const Joi = require("joi");

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

const scanRfidSchema = Joi.object({
  rfid_tag: Joi.string().required(),
});

module.exports = {
  createOutboundSchema,
  scanRfidSchema,
};
