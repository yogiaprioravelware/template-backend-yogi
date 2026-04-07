
const express = require("express");
const userController = require("../controllers/user");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.get("/", authMiddleware, authorize("user:read"), userController.getUsers);
router.get("/:id", authMiddleware, authorize("user:read"), userController.getUserById);
router.put("/:id", authMiddleware, authorize("user:update"), userController.updateUser);
router.put("/:id/role", authMiddleware, authorize("user:update"), userController.assignRole);
router.delete("/:id", authMiddleware, authorize("user:delete"), userController.deleteUser);

module.exports = router;
