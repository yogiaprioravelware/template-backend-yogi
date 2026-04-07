const express = require("express");
const locationController = require("../controllers/location");
const authMiddleware = require("../middlewares/auth-middleware");
const authorize = require("../middlewares/permission-middleware");

const router = express.Router();

router.post("/", authMiddleware, authorize("location:create"), locationController.createLocation);
router.get("/", authMiddleware, authorize("location:read"), locationController.getLocations);
router.get("/:id", authMiddleware, authorize("location:read"), locationController.getLocationById);
router.put("/:id", authMiddleware, authorize("location:update"), locationController.updateLocation);
router.delete("/:id", authMiddleware, authorize("location:delete"), locationController.deleteLocation);

module.exports = router;
