const express = require("express");
const inventoryController = require("../controllers/inventory");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const validate = require("../middlewares/validation-middleware");
const { transferLocationSchema } = require("../validations/inventory-validation");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post(
  "/transfer",
  authMiddleware,
  authorize(PERMISSIONS.ITEM_UPDATE),
  validate(transferLocationSchema),
  inventoryController.transferLocation
);

module.exports = router;
