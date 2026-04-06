const User = require("../../models/User");
const logger = require("../../utils/logger");

// Service untuk mengambil semua pengguna
const getUsers = async () => {
  logger.info("Fetching all users from the database");
  const users = await User.findAll({
    attributes: ["id", "name", "email", "role", "created_at"],
  });
  logger.info(`Found ${users.length} users`);
  return users;
};

module.exports = getUsers;