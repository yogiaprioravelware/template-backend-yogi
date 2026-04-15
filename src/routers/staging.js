const express = require("express");
const stagingController = require("../controllers/staging");
const router = express.Router();

// Middleware authentication assumed to be handled in app.js or similar
// For now, these routes are public or handled by global auth middleware if present

router.post("/", stagingController.createSession);
router.get("/", stagingController.getStagingSessions);
router.get("/:id", stagingController.getSessionDetail);
router.post("/:id/items", stagingController.addStagingItem);
router.post("/:id/finalize", stagingController.finalizeSession);

module.exports = router;
