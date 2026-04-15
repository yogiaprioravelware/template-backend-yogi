const express = require("express");
const inboundController = require("../controllers/inbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const validate = require("../middlewares/validation-middleware");
const { 
  createInboundSchema, 
  scanRfidReceivedSchema, 
  scanQrStoredSchema 
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
  "/:inboundId/scan-received", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_UPDATE), 
  validate(scanRfidReceivedSchema),
  inboundController.scanRfidReceived
);

router.post(
  "/scan-stored", 
  authMiddleware, 
  authorize(PERMISSIONS.INBOUND_UPDATE), 
  validate(scanQrStoredSchema),
  inboundController.scanQrStored
);

module.exports = router;
