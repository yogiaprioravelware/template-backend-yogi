const checkUserPermission = require("../services/role/check-user-permission-service");
const response = require("../utils/response");
const logger = require("../utils/logger");

const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn(`Unauthorized access attempt for: ${requiredPermission}`);
        return res.status(401).json(response.error("Unauthorized"));
      }

      const hasPermission = await checkUserPermission(req.user, requiredPermission);

      if (!hasPermission) {
        logger.warn(`Forbidden access: User ${req.user.id} tried to access ${requiredPermission}`);
        return res
          .status(403)
          .json(response.error("Forbidden: You don't have permission for this action"));
      }

      next();
    } catch (error) {
      logger.error(`Authorize middleware error: ${error.message}`);
      return res.status(500).json(response.error("Internal Server Error"));
    }
  };
};

module.exports = authorize;
