const Permission = require("../../models/Permission");
const Role = require("../../models/Role");
const logger = require("../../utils/logger");

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
