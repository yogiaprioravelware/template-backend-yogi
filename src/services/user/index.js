const registerUser = require("./register-service");
const loginUser = require("./login-service");
const getUsers = require("./get-users-service");
const getUserById = require("./get-user-by-id-service");
const updateUser = require("./update-user-service");
const deleteUser = require("./delete-user-service");
const assignRole = require("./assign-role-service");
const refreshToken = require("./refresh-token-service");

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
