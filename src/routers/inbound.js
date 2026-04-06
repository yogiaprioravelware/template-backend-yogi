const express = require("express");
const inboundController = require("../controllers/inbound");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/", authMiddleware, inboundController.createInbound);
router.get("/", authMiddleware, inboundController.getInbounds);
router.get("/:id", authMiddleware, inboundController.getInboundDetail);
router.post("/:inboundId/scan-item", authMiddleware, inboundController.scanItem);
router.post("/:inboundId/set-location", authMiddleware, inboundController.setLocation);

module.exports = router;
