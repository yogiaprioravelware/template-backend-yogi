const { User } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Memperbarui data profil user berdasarkan ID.
 * @param {number} id 
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
const updateUser = async (id, userData) => {
  logger.info(`Attempting to update user with id: ${id}`);
  
  const user = await User.findByPk(id);
  
  if (!user) {
    logger.warn(`Update failed: User with id ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // Prevent password update via this general service if needed
  const { password, ...updateData } = userData;

  await user.update(updateData);
  
  logger.info(`User with id: ${id} updated successfully`);
  
  return user;
};

module.exports = updateUser;