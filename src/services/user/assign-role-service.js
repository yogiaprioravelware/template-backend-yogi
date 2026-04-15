const { User } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Memperbarui role_id milik user berdasarkan ID.
 * @param {number} id 
 * @param {Object} roleData 
 * @returns {Promise<Object>}
 */
const assignRole = async (id, roleData) => {
  logger.info(`Attempting to assign role to user with id: ${id}`);
  
  const user = await User.findByPk(id);
  
  if (!user) {
    logger.warn(`Role assignment failed: User with id ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const { role_id } = roleData;
  await user.update({ role_id });

  logger.info(`User with id: ${id} role updated to role_id: ${role_id}`);
  
  return { 
    message: "User role updated successfully", 
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id
    }
  };
};

module.exports = assignRole;