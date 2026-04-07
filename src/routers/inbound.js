const express = require("express");
const inboundController = require("../controllers/inbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

router.post("/", authMiddleware, authorize("inbound:create"), inboundController.createInbound);
router.get("/", authMiddleware, authorize("inbound:read"), inboundController.getInbounds);
router.get("/:id", authMiddleware, authorize("inbound:read"), inboundController.getInboundDetail);
router.post("/:inboundId/scan-item", authMiddleware, authorize("inbound:update"), inboundController.scanItem);
router.post("/:inboundId/set-location", authMiddleware, authorize("inbound:update"), inboundController.setLocation);

module.exports = router;
