const express = require("express");
const locationController = require("../controllers/location");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.post("/", authMiddleware, locationController.createLocation);
router.get("/", authMiddleware, locationController.getLocations);
router.get("/:id", authMiddleware, locationController.getLocationById);
router.put("/:id", authMiddleware, locationController.updateLocation);
router.delete("/:id", authMiddleware, locationController.deleteLocation);

module.exports = router;
