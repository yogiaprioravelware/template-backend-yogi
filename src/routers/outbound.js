const express = require("express");
const outboundController = require("../controllers/outbound");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/", authMiddleware, outboundController.createOutbound);
router.get("/", authMiddleware, outboundController.getOutbounds);
router.get("/:id", authMiddleware, outboundController.getOutboundDetail);
router.post("/:outboundId/scan", authMiddleware, outboundController.scanRfidPicking);

module.exports = router;
