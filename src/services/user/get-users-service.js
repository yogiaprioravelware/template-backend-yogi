const { User, Role } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mengambil daftar user dengan dukungan pagination dan detail Role.
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<Object>}
 */
const getUsers = async ({ page = 1, limit = 10 } = {}) => {
  logger.info(`Fetching users with pagination: page=${page}, limit=${limit}`);

  const offset = (page - 1) * limit;

  const { count, rows: users } = await User.findAndCountAll({
    attributes: ["id", "name", "email", "created_at"],
    include: [
      {
        model: Role,
        as: "role_detail",
        attributes: ["id", "name", "description"],
      },
    ],
    limit: Number.parseInt(limit),
    offset: Number.parseInt(offset),
    order: [["created_at", "DESC"]],
  });

  logger.info(`Found ${users.length} users out of ${count} total`);

  return {
    data: users,
    pagination: {
      total: count,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      total_pages: Math.ceil(count / limit)
    }
  };
};

module.exports = getUsers;