
const response = require("../utils/response");
const logger = require("../utils/logger");

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(`${status} - ${message}`);
  
  res.status(status).json(response.error(message));
};

module.exports = errorMiddleware;
