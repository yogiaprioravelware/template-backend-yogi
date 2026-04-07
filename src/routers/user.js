const express = require("express");
const userController = require("../controllers/user");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.get("/", authMiddleware, authorize(PERMISSIONS.USER_READ), userController.getUsers);
router.get("/:id", authMiddleware, authorize(PERMISSIONS.USER_READ), userController.getUserById);
router.put("/:id", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), userController.updateUser);
router.put("/:id/role", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), userController.assignRole);
router.delete("/:id", authMiddleware, authorize(PERMISSIONS.USER_DELETE), userController.deleteUser);

module.exports = router;
