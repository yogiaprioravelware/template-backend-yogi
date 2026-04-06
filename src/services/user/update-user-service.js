const User = require("../../models/User");
const { updateUserSchema } = require("../../validations/user-validation");
const logger = require("../../utils/logger");

// Service untuk memperbarui data pengguna
const updateUser = async (id, userData) => {
  logger.info(`Attempting to update user with id: ${id}`);
  const { error } = updateUserSchema.validate(userData);
  if (error) {
    logger.warn(`Validation error during user update: ${error.details[0].message}`);
    const err = new Error(error.details[0].message);
    err.status = 400;
    throw err;
  }

  const user = await User.findByPk(id);
  if (!user) {
    logger.warn(`Update failed: User with id ${id} not found`);
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await user.update(userData);
  logger.info(`User with id: ${id} updated successfully`);
  return user;
};

module.exports = updateUser;