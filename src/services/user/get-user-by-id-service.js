const User = require("../../models/User");
const logger = require("../../utils/logger");

// Service untuk mengambil pengguna berdasarkan ID
const getUserById = async (id) => {
  logger.info(`Fetching user with id: ${id}`);
  const user = await User.findByPk(id, {
    attributes: ["id", "name", "email", "role", "created_at"],
  });
  if (!user) {
    logger.warn(`User with id: ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  logger.info(`User with id: ${id} found`);
  return user;
};

module.exports = getUserById;