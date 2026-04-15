const response = require("../utils/response");
const logger = require("../utils/logger");

/**
 * Global Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.errors || null;

  // Handle Sequelize Specific Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 400;
    message = 'Data already exists';
    details = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = 'Data validation failed';
    details = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeDatabaseError') {
    // Hidden database details for security
    message = 'Database operation failed';
    if (process.env.NODE_ENV === 'development') {
        details = err.message;
    }
  }

  // Log the error
  logger.error(`${status} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (status === 500 && process.env.NODE_ENV !== 'production') {
    logger.error(err.stack);
  }
  
  res.status(status).json(response.error(message, details, status));
};

module.exports = errorMiddleware;
