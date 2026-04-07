
const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().integer().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
  role_id: Joi.number().integer().optional(),
});

const assignRoleSchema = Joi.object({
  role_id: Joi.number().integer().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  assignRoleSchema,
};

