const express = require("express");
const itemController = require("../controllers/item");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post("/", authMiddleware, authorize(PERMISSIONS.ITEM_CREATE), itemController.registerItem);
router.post("/opname", authMiddleware, authorize(PERMISSIONS.ITEM_UPDATE), itemController.setStockOpname);
router.get("/", authMiddleware, authorize(PERMISSIONS.ITEM_READ), itemController.getItems);
router.get("/reconciliation", authMiddleware, authorize(PERMISSIONS.ITEM_READ), itemController.getReconciliation);
router.get("/:id", authMiddleware, authorize(PERMISSIONS.ITEM_READ), itemController.getItemById);
router.get("/:id/history", authMiddleware, authorize(PERMISSIONS.ITEM_READ), itemController.getItemHistory);
router.put("/:id", authMiddleware, authorize(PERMISSIONS.ITEM_UPDATE), itemController.updateItem);
router.delete("/:id", authMiddleware, authorize(PERMISSIONS.ITEM_DELETE), itemController.deleteItem);

module.exports = router;
