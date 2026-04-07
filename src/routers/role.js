const express = require("express");
const roleController = require("../controllers/role");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

// Get all roles (for dropdowns/selection in frontend)
router.get("/", authMiddleware, authorize(PERMISSIONS.USER_READ), roleController.getRoles);

// Get all permissions (for the checklist in frontend)
router.get("/permissions", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), roleController.getPermissions);

// Assign permissions to a role (save checklist)
router.post("/:id/assign-permissions", authMiddleware, authorize(PERMISSIONS.USER_UPDATE), roleController.assignPermissions);

module.exports = router;
