const Permission = require("../../models/Permission");
const logger = require("../../utils/logger");

const getPermissions = async () => {
  logger.info("Fetching all permissions for ACL management");
  try {
    const permissions = await Permission.findAll({
      order: [["module", "ASC"], ["name", "ASC"]],
    });

    // Group by module
    const grouped = permissions.reduce((acc, p) => {
      if (!acc[p.module]) {
        acc[p.module] = [];
      }
      acc[p.module].push({
        id: p.id,
        name: p.name,
        action: p.action,
        description: p.description,
      });
      return acc;
    }, {});

    return grouped;
  } catch (error) {
    logger.error(`Error fetching permissions: ${error.message}`);
    throw error;
  }
};

module.exports = getPermissions;
