const express = require("express");
const userController = require("../controllers/user");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const validate = require("../middlewares/validation-middleware");
const { 
  registerSchema, 
  loginSchema, 
  updateUserSchema, 
  assignRoleSchema 
} = require("../validations/user-validation");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post("/register", validate(registerSchema), userController.registerUser);
router.post("/login", validate(loginSchema), userController.loginUser);
router.post("/refresh", userController.refreshToken);

router.get("/", authMiddleware, authorize(PERMISSIONS.USER_READ), userController.getUsers);
router.get("/:id", authMiddleware, authorize(PERMISSIONS.USER_READ), userController.getUserById);
router.put("/:id", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), validate(updateUserSchema), userController.updateUser);
router.put("/:id/role", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), validate(assignRoleSchema), userController.assignRole);
router.delete("/:id", authMiddleware, authorize(PERMISSIONS.USER_DELETE), userController.deleteUser);

module.exports = router;
