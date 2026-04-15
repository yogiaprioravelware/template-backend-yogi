const { Role, Permission } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil daftar nama permission yang dimiliki oleh user berdasarkan role-nya.
 * Jika user adalah admin, akan mengembalikan seluruh permission yang ada.
 * @param {Object} user - User object from request (with role_id and optionally role)
 * @returns {Promise<string[]>} Array of permission names
 */
const getUserPermissions = async (user) => {
  if (!user || (!user.role_id && user.role !== "admin")) {
    return [];
  }

  // Admin bypass
  if (user.role === "admin") {
    const allPerms = await Permission.findAll({ attributes: ["name"] });
    return allPerms.map(p => p.name);
  }

  try {
    const role = await Role.findByPk(user.role_id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          attributes: ["name"],
          through: { attributes: [] }
        }
      ]
    });

    if (!role || !role.permissions) return [];
    
    return role.permissions.map(p => p.name);
  } catch (error) {
    logger.error(`Error fetching user permissions: ${error.message}`);
    return [];
  }
};

module.exports = getUserPermissions;
