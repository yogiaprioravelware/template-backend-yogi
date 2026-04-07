const express = require("express");
const itemController = require("../controllers/item");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

router.post("/", authMiddleware, authorize("item:create"), itemController.registerItem);
router.get("/", authMiddleware, authorize("item:read"), itemController.getItems);
router.get("/:id", authMiddleware, authorize("item:read"), itemController.getItemById);
router.put("/:id", authMiddleware, authorize("item:update"), itemController.updateItem);
router.delete("/:id", authMiddleware, authorize("item:delete"), itemController.deleteItem);

module.exports = router;
