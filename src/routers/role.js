const express = require("express");
const roleController = require("../controllers/role");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

// Get all roles (for dropdowns/selection in frontend)
router.get("/", authMiddleware, authorize("user:read"), roleController.getRoles);

// Get all permissions (for the checklist in frontend)
router.get("/permissions", authMiddleware, authorize("user:update"), roleController.getPermissions);

// Assign permissions to a role (save checklist)
router.post("/:id/assign-permissions", authMiddleware, authorize("user:update"), roleController.assignPermissions);

module.exports = router;
