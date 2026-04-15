const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const logger = require("../../utils/logger");
const getUserPermissions = require("../role/get-user-permissions-service");

/**
 * Memproses login user: verifikasi kredensial dan generate JWT tokens.
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
const loginUser = async (userData) => {
  const { email, password } = userData;
  logger.info(`Login attempt for user: ${email}`);

  // Mengambil user beserta detail role untuk kelengkapan token
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

  const permissions = await getUserPermissions(user);

  const accessToken = jwt.sign(
    { 
      id: user.id, 
      name: user.name, 
      role_id: user.role_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  logger.info(`Successful login for user: ${email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      role: user.role,
      permissions,
    },
    accessToken,
    refreshToken
  };
};

module.exports = loginUser;