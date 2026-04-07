const RolePermission = require("../../models/RolePermission");
const Role = require("../../models/Role");
const Permission = require("../../models/Permission");
const logger = require("../../utils/logger");
const sequelize = require("../../utils/database");

const assignRolePermissions = async (roleId, permissionIds) => {
  logger.info(`Assigning permissions to role ID ${roleId}`);
  
  const role = await Role.findByPk(roleId);
  if (!role) {
    logger.warn(`Role ID ${roleId} not found`);
    const error = new Error("Role not found");
    error.status = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();
  
  try {
    // 1. Remove all current permissions for this role
    await RolePermission.destroy({
      where: { role_id: roleId },
      transaction,
    });

    // 2. Add new permissions
    if (permissionIds && permissionIds.length > 0) {
      const records = permissionIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      }));
      await RolePermission.bulkCreate(records, { transaction });
    }

    await transaction.commit();
    logger.info(`Successfully updated permissions for role ${role.name}`);
    return { success: true, roleId, count: permissionIds.length };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error assigning permissions: ${error.message}`);
    throw error;
  }
};

module.exports = assignRolePermissions;
