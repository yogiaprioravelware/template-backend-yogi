const { User } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Menghapus user berdasarkan ID.
 * @param {number} id 
 * @returns {Promise<Object>}
 */
const deleteUser = async (id) => {
  logger.info(`Attempting to delete user with id: ${id}`);
  
  const user = await User.findByPk(id);
  
  if (!user) {
    logger.warn(`Deletion failed: User with id ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await user.destroy();
  
  logger.info(`User with id: ${id} deleted successfully`);
  
  return { message: "User deleted successfully" };
};

module.exports = deleteUser;