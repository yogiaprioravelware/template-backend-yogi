const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { registerSchema, loginSchema, updateUserSchema } = require("../../validations/user-validation");

// Service untuk registrasi pengguna
const registerUser = async (userData) => {
  const { error } = registerSchema.validate(userData);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { name, email, password } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const err = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return User.create({ name, email, password: hashedPassword });
};

// Service untuk login pengguna
const loginUser = async (userData) => {
  const { error } = loginSchema.validate(userData);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { email, password } = userData;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token };
};

// Service untuk mengambil semua pengguna
const getUsers = async () => {
  return User.findAll();
};

// Service untuk mengambil pengguna berdasarkan ID
const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
};

// Service untuk memperbarui data pengguna
const updateUser = async (id, userData) => {
  const { error } = updateUserSchema.validate(userData);
  if (error) {
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await user.update(userData);
  return user;
};

// Service untuk menghapus pengguna
const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await user.destroy();
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
