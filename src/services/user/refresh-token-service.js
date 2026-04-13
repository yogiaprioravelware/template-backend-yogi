const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");

const refreshToken = async (token) => {
  if (!token) {
    const err = new Error("Refresh token is required");
    err.status = 400;
    throw err;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // In a real enterprise app, we might check if this refreshToken is in a whitelist/DB
    // to allow revocation. For now, we trust the signature.
    
    const User = require("../../models/User");
    const user = await User.findByPk(payload.id);
    
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      throw err;
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    return { accessToken };
  } catch (error) {
    logger.error(`Refresh Token Error: ${error.message}`);
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }
};

module.exports = refreshToken;
