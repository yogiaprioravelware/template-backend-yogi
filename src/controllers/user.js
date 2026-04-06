
const userService = require("../services/user");
const response = require("../utils/response");
const logger = require("../utils/logger");

// Registrasi pengguna baru
const registerUser = async (req, res, next) => {
  logger.info("Registering a new user");
  try {
    const result = await userService.registerUser(req.body);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Login pengguna
const loginUser = async (req, res, next) => {
  logger.info("User login attempt");
  try {
    const result = await userService.loginUser(req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Mengambil semua data pengguna
const getUsers = async (req, res, next) => {
  logger.info("Fetching all users");
  try {
    const users = await userService.getUsers();
    res.json(response.success(users));
  } catch (err) {
    next(err);
  }
};

// Mengambil data pengguna berdasarkan ID
const getUserById = async (req, res, next) => {
  logger.info(`Fetching user with id: ${req.params.id}`);
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(response.success(user));
  } catch (err) {
    next(err);
  }
};

// Memperbarui data pengguna
const updateUser = async (req, res, next) => {
  logger.info(`Updating user with id: ${req.params.id}`);
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Menghapus pengguna
const deleteUser = async (req, res, next) => {
  logger.info(`Deleting user with id: ${req.params.id}`);
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Mengubah role pengguna
const assignRole = async (req, res, next) => {
  logger.info(`Assigning role to user with id: ${req.params.id}`);
  try {
    const result = await userService.assignRole(req.params.id, req.body);
    res.json(response.success(result));
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
};