
const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid("admin", "operator").optional(),
});

const assignRoleSchema = Joi.object({
  role: Joi.string().valid("admin", "operator").required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  assignRoleSchema,
};

