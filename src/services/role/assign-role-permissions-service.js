const { Role, Permission, RolePermission, sequelize } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Memperbarui daftar permission yang diasosiasikan dengan sebuah role.
 * Menggunakan transaksi untuk menjamin integritas data (hapus lama, pasang baru).
 * @param {number} roleId 
 * @param {number[]} permissionIds 
 * @returns {Promise<Object>}
 */
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
    // Bersihkan permission lama
    await RolePermission.destroy({
      where: { role_id: roleId },
      transaction,
    });

    // Tambahkan permission baru jika ada
    let count = 0;
    if (permissionIds && permissionIds.length > 0) {
      const records = permissionIds.map((pid) => ({
        role_id: roleId,
        permission_id: pid,
      }));
      await RolePermission.bulkCreate(records, { transaction });
      count = records.length;
    }

    await transaction.commit();
    logger.info(`Successfully updated permissions for role ${role.name}`);
    
    return { 
      message: "Role permissions updated successfully",
      roleId, 
      count 
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error assigning permissions: ${error.message}`);
    throw error;
  }
};

module.exports = assignRolePermissions;
