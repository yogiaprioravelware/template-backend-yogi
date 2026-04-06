const express = require("express");
const itemController = require("../controllers/item");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/", authMiddleware, itemController.registerItem);
router.get("/", authMiddleware, itemController.getItems);
router.get("/:id", authMiddleware, itemController.getItemById);
router.put("/:id", authMiddleware, itemController.updateItem);
router.delete("/:id", authMiddleware, itemController.deleteItem);

module.exports = router;
