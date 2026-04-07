const express = require("express");
const outboundController = require("../controllers/outbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post("/", authMiddleware, authorize(PERMISSIONS.OUTBOUND_CREATE), outboundController.createOutbound);
router.get("/", authMiddleware, authorize(PERMISSIONS.OUTBOUND_READ), outboundController.getOutbounds);
router.get("/:id", authMiddleware, authorize(PERMISSIONS.OUTBOUND_READ), outboundController.getOutboundDetail);
router.post("/:outboundId/scan", authMiddleware, authorize(PERMISSIONS.OUTBOUND_UPDATE), outboundController.scanRfidPicking);

module.exports = router;
