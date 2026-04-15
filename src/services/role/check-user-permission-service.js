const { Role, Permission } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengecek apakah user memiliki permission tertentu.
 * Admin selalu memiliki akses penuh (true).
 * @param {Object} user 
 * @param {string} requiredPermission 
 * @returns {Promise<boolean>}
 */
const checkUserPermission = async (user, requiredPermission) => {
  if (!user || (!user.role_id && !user.role)) {
    logger.warn("Permission check failed: User information is missing");
    return false;
  }

  // Admin always has full access
  if (user.role === "admin") return true;

  try {
    const role = await Role.findByPk(user.role_id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          where: { name: requiredPermission },
          required: true,
        },
      ],
    });

    return !!role;
  } catch (error) {
    logger.error(`Error checking user permission: ${error.message}`);
    return false;
  }
};

module.exports = checkUserPermission;
