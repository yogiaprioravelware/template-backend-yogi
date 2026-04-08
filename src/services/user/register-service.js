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

  const { name, email, password, role_id } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    logger.warn(`Registration failed: Email ${email} already in use`);
    const err = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Tentukan role_id final
  let finalRoleId = role_id;
  let finalRoleName = "operator";

  if (finalRoleId) {
    const selectedRole = await Role.findByPk(finalRoleId);
    if (selectedRole) {
      finalRoleName = selectedRole.name;
    }
  } else {
    const defaultRole = await Role.findOne({ where: { name: "operator" } });
    finalRoleId = defaultRole ? defaultRole.id : null;
  }

  const newUser = await User.create({ 
    name, 
    email, 
    password: hashedPassword, 
    role: finalRoleName,
    role_id: finalRoleId
  });
  logger.info(`User ${email} registered successfully`);
  return newUser;
};

module.exports = registerUser;