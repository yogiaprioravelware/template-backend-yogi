const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { loginSchema } = require("../../validations/user-validation");
const logger = require("../../utils/logger");

// Service untuk login pengguna
const loginUser = async (userData) => {
  logger.info(`Login attempt for user: ${userData.email}`);
  const { error } = loginSchema.validate(userData);
  if (error) {
    logger.warn(`Validation error during login: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const { email, password } = userData;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    logger.warn(`Login failed: User with email ${email} not found`);
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn(`Login failed: Invalid password for user ${email}`);
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, role_id: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const getUserPermissions = require("../role/get-user-permissions-service");
  const permissions = await getUserPermissions(user);

  logger.info(`User ${email} logged in successfully`);
  return { 
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      role_id: user.role_id,
      permissions
    }, 
    token 
  };
};

module.exports = loginUser;