const userService = require("../services/user");
const response = require("../utils/response");
const logger = require("../utils/logger");

const registerUser = async (req, res, next) => {
  logger.info("Registering a new user");
  try {
    const result = await userService.registerUser(req.body);
    res.status(201).json(response.success(result, "User berhasil didaftarkan"));
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  logger.info("User login attempt");
  try {
    const result = await userService.loginUser(req.body);
    res.json(response.success(result, "Login berhasil"));
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  const { page, limit } = req.query;
  logger.info(`Fetching users - Page: ${page || 1}, Limit: ${limit || 10}`);
  try {
    const result = await userService.getUsers({ page, limit });
    res.json(response.success(result.data, "Daftar user berhasil diambil", { pagination: result.pagination }));
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  logger.info(`Fetching user with id: ${req.params.id}`);
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(response.success(user, "Data user berhasil diambil"));
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  logger.info(`Updating user with id: ${req.params.id}`);
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.json(response.success(result, "Data user berhasil diperbarui"));
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  logger.info(`Deleting user with id: ${req.params.id}`);
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(response.success(result, "User berhasil dihapus"));
  } catch (err) {
    next(err);
  }
};

const assignRole = async (req, res, next) => {
  logger.info(`Assigning role to user with id: ${req.params.id}`);
  try {
    const result = await userService.assignRole(req.params.id, req.body);
    res.json(response.success(result, "Role user berhasil diperbarui"));
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  logger.info("Token refresh attempt");
  try {
    const { refreshToken: token } = req.body;
    const result = await userService.refreshToken(token);
    res.json(response.success(result, "Token berhasil diperbarui"));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  refreshToken,
};