const express = require("express");
const locationController = require("../controllers/location");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");
const PERMISSIONS = require("../utils/permission");

const router = express.Router();

router.post("/", authMiddleware, authorize(PERMISSIONS.LOCATION_CREATE), locationController.createLocation);
router.get("/", authMiddleware, authorize(PERMISSIONS.LOCATION_READ), locationController.getLocations);
router.get("/:id", authMiddleware, authorize(PERMISSIONS.LOCATION_READ), locationController.getLocationById);
router.put("/:id", authMiddleware, authorize(PERMISSIONS.LOCATION_UPDATE), locationController.updateLocation);
router.delete("/:id", authMiddleware, authorize(PERMISSIONS.LOCATION_DELETE), locationController.deleteLocation);

module.exports = router;
