const Role = require("../../models/Role");
const Permission = require("../../models/Permission");
const logger = require("../../utils/logger");

/**
 * Returns a simple array of permission names for a given role_id or role name
 */
const getUserPermissions = async (user) => {
  if (!user || (!user.role_id && user.role !== "admin")) {
    return [];
  }

  // Admin bypass: if total control is needed, we could fetch all permissions
  // but for testing, let's just mark them as 'all' or return the full list.
  if (user.role === "admin") {
    const allPerms = await Permission.findAll();
    return allPerms.map(p => p.name);
  }

  try {
    const role = await Role.findByPk(user.role_id, {
      include: [
        {
          model: Permission,
          attributes: ["name"],
          through: { attributes: [] }
        }
      ]
    });

    if (!role) return [];
    return role.Permissions.map(p => p.name);
  } catch (error) {
    logger.error(`Error fetching user permissions: ${error.message}`);
    return [];
  }
};

module.exports = getUserPermissions;
