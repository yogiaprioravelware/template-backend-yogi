const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Role = require("../../models/Role");
const { registerSchema } = require("../../validations/user-validation");
const logger = require("../../utils/logger");

// Service untuk registrasi pengguna
const registerUser = async (userData) => {
  logger.info("Attempting to register a new user");
  const { error } = registerSchema.validate(userData);
  if (error) {
    logger.warn(`Validation error during user registration: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { name, email, password } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    logger.warn(`Registration failed: Email ${email} already in use`);
    const err = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Find default operator role
  const operatorRole = await Role.findOne({ where: { name: "operator" } });

  const newUser = await User.create({ 
    name, 
    email, 
    password: hashedPassword, 
    role: "operator",
    role_id: operatorRole ? operatorRole.id : null
  });
  logger.info(`User ${email} registered successfully`);
  return newUser;
};

module.exports = registerUser;