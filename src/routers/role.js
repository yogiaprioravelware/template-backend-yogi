const express = require("express");
const roleController = require("../controllers/role");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.get("/", authMiddleware, authorize(PERMISSIONS.USER_READ), roleController.getRoles);
router.get("/permissions", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), roleController.getPermissions);
router.post("/:id/assign-permissions", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), roleController.assignPermissions);

module.exports = router;
