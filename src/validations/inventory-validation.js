const Joi = require("joi");

const transferLocationSchema = Joi.object({
  item_id: Joi.number().integer().required(),
  from_location_id: Joi.number().integer().required(),
  to_location_id: Joi.number().integer().required(),
  qty: Joi.number().integer().min(1).required(),
});

module.exports = {
  transferLocationSchema,
};
