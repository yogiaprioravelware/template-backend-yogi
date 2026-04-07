const express = require("express");
const outboundController = require("../controllers/outbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

router.post("/", authMiddleware, authorize("outbound:create"), outboundController.createOutbound);
router.get("/", authMiddleware, authorize("outbound:read"), outboundController.getOutbounds);
router.get("/:id", authMiddleware, authorize("outbound:read"), outboundController.getOutboundDetail);
router.post("/:outboundId/scan", authMiddleware, authorize("outbound:update"), outboundController.scanRfidPicking);

module.exports = router;
