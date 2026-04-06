const User = require("../../models/User");
const { assignRoleSchema } = require("../../validations/user-validation");
const logger = require("../../utils/logger");

// Service untuk mengubah role pengguna
const assignRole = async (id, roleData) => {
  logger.info(`Attempting to assign role to user with id: ${id}`);
  const { error } = assignRoleSchema.validate(roleData);
  if (error) {
    logger.warn(`Validation error during role assignment: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(id);
  if (!user) {
    logger.warn(`Role assignment failed: User with id ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const { role } = roleData;
  await user.update({ role });

  logger.info(`User with id: ${id} role updated to ${role}`);
  return { message: `User role updated to ${role}`, user };
};

module.exports = assignRole;