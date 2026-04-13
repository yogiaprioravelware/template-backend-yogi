const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory");
const authMiddleware = require("../middlewares/auth-middleware");

// Semua route di inventory membutuhkan autentikasi
router.use(authMiddleware);

// Endpoint internal transfer
router.post("/transfer", inventoryController.transferLocation);

module.exports = router;
