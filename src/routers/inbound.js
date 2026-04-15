const express = require("express");
const inboundController = require("../controllers/inbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const validate = require("../middlewares/validation-middleware");
const { 
  createInboundSchema, 
  scanItemSchema, 
  setLocationSchema 
} = require("../validations/inbound-validation");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post(
  "/", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_CREATE), 
  validate(createInboundSchema),
  inboundController.createInbound
);

router.get(
  "/", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_READ), 
  inboundController.getInbounds
);

router.get(
  "/:id", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_READ), 
  inboundController.getInboundDetail
);

router.post(
  "/:inboundId/scan-item", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_UPDATE), 
  validate(scanItemSchema),
  inboundController.scanItem
);

router.post(
  "/:inboundId/set-location", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_UPDATE), 
  validate(setLocationSchema),
  inboundController.setLocation
);

module.exports = router;
