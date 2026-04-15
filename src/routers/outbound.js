const express = require("express");
const outboundController = require("../controllers/outbound");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const validate = require("../middlewares/validation-middleware");
const { 
  createOutboundSchema, 
  scanQrPickingSchema,
  scanRfidStagingSchema
} = require("../validations/outbound-validation");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post(
  "/", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_CREATE), 
  validate(createOutboundSchema),
  outboundController.createOutbound
);

router.get(
  "/", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_READ), 
  outboundController.getOutbounds
);

router.get(
  "/:id", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_READ), 
  outboundController.getOutboundDetail
);

router.post(
  "/:outboundId/scan-picking", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_UPDATE), 
  validate(scanQrPickingSchema),
  outboundController.scanQrPicking
);

router.post(
  "/scan-staging", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_UPDATE), 
  validate(scanRfidStagingSchema),
  outboundController.scanRfidStaging
);

router.post(
  "/:id/finalize", 
  authMiddleware, 
  authorize(PERMISSIONS.OUTBOUND_UPDATE), 
  outboundController.finalizeOutbound
);

module.exports = router;
