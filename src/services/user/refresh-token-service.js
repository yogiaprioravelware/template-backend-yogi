const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Menghasilkan Access Token baru menggunakan Refresh Token yang valid.
 * @param {string} token 
 * @returns {Promise<Object>}
 */
const refreshToken = async (token) => {
  if (!token) {
    const err = new Error("Refresh token is required");
    err.status = 400;
    throw err;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findByPk(payload.id);
    
    if (!user) {
      const err = new Error("User not found");
      err.status = 401;
      throw err;
    }

    // Generate new access token with updated payload
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        role_id: user.role_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );

    return { accessToken };
  } catch (error) {
    if (error.status) throw error;
    logger.error(`Refresh Token Error: ${error.message}`);
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }
};

module.exports = refreshToken;
