const { User, Role } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil detail user berdasarkan ID beserta informasi role.
 * @param {number} id 
 * @returns {Promise<Object>}
 */
const getUserById = async (id) => {
  logger.info(`Fetching user with id: ${id}`);
  
  const user = await User.findByPk(id, {
    attributes: ["id", "name", "email", "created_at"],
    include: [
      {
        model: Role,
        as: "role_detail",
        attributes: ["id", "name", "description"],
      },
    ],
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