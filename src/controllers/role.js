const Role = require("../models/Role");
const getPermissionsService = require("../services/role/get-permissions-service");
const assignRolePermissionsService = require("../services/role/assign-role-permissions-service");
const response = require("../utils/response");
const logger = require("../utils/logger");

const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.status(200).json(response.success(roles));
  } catch (error) {
    logger.error(`Error in getRoles controller: ${error.message}`);
    return res.status(500).json(response.error("Internal Server Error"));
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await getPermissionsService();
    return res.status(200).json(response.success(permissions));
  } catch (error) {
    logger.error(`Error in getPermissions controller: ${error.message}`);
    return res.status(500).json(response.error("Internal Server Error"));
  }
};

const assignPermissions = async (req, res) => {
  const { id } = req.params; // roleId
  const { permissionIds } = req.body;

  try {
    const result = await assignRolePermissionsService(id, permissionIds);
    return res.status(200).json(response.success(result));
  } catch (error) {
    logger.error(`Error in assignPermissions controller: ${error.message}`);
    const status = error.status || 500;
    return res.status(status).json(response.error(error.message));
  }
};

module.exports = {
  getRoles,
  getPermissions,
  assignPermissions,
};
