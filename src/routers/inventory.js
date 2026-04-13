const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory");
const authMiddleware = require("../middlewares/auth-middleware");

router.use(authMiddleware);

router.post("/transfer", inventoryController.transferLocation);

module.exports = router;
