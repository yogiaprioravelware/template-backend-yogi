
const express = require("express");
const userController = require("../controllers/user");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.get("/", authMiddleware, userController.getUsers);
router.get("/:id", authMiddleware, userController.getUserById);
router.put("/:id", authMiddleware, userController.updateUser);
router.put("/:id/role", authMiddleware, userController.assignRole);
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;
