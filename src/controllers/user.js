
const userService = require("../services/user/user-service");
const response = require("../utils/response");

// Registrasi pengguna baru
const registerUser = async (req, res, next) => {
  try {
    const result = await userService.registerUser(req.body);
    res.status(201).json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Login pengguna
const loginUser = async (req, res, next) => {
  try {
    const result = await userService.loginUser(req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Mengambil semua data pengguna
const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.json(response.success(users));
  } catch (err) {
    next(err);
  }
};

// Mengambil data pengguna berdasarkan ID
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(response.success(user));
  } catch (err) {
    next(err);
  }
};

// Memperbarui data pengguna
const updateUser = async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body);
    res.json(response.success(result));
  } catch (err) {
    next(err);
  }
};

// Menghapus pengguna
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json(response.success("User deleted successfully"));
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
};
