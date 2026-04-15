const bcrypt = require("bcryptjs");
const { User, Role } = require("../../models");
const logger = require("../../utils/logger");

/**
 * Mendaftarkan user baru ke sistem.
 * @param {Object} userData 
 * @returns {Promise<Object>}
 */
const registerUser = async (userData) => {
  logger.info("Attempting to register a new user");
  
  const { name, email, password, role_id } = userData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    logger.warn(`Registration failed: Email ${email} already in use`);
    const err = new Error("Email already in use");
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let finalRoleId = role_id;
  let finalRoleName = "operator";

  if (finalRoleId) {
    const selectedRole = await Role.findByPk(finalRoleId);
    if (selectedRole) {
      finalRoleName = selectedRole.name;
    } else {
        // Jika role_id tidak valid, gunakan default operator
        const defaultRole = await Role.findOne({ where: { name: "operator" } });
        finalRoleId = defaultRole ? defaultRole.id : null;
    }
  } else {
    const defaultRole = await Role.findOne({ where: { name: "operator" } });
    finalRoleId = defaultRole ? defaultRole.id : null;
    finalRoleName = defaultRole ? defaultRole.name : "operator";
  }

  const newUser = await User.create({ 
    name, 
    email, 
    password: hashedPassword, 
    role: finalRoleName,
    role_id: finalRoleId
  });

  logger.info(`User ${email} registered successfully`);
  
  // Kembalikan objek user tanpa password
  const result = newUser.toJSON();
  delete result.password;
  
  return result;
};

module.exports = registerUser;