
const response = require('../utils/response');

/**
 * Middleware untuk validasi request menggunakan Joi schema.
 * @param {Object} schema - Joi schema object
 * @param {string} source - Sumber data (body, query, params)
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return res.status(400).json(response.error("Validation Error", details, 400));
  }

  // Simpan nilai yang sudah divalidasi dan di-strip kembali ke request
  req[source] = value;
  next();
};

module.exports = validate;
