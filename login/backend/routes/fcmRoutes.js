const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const fcmController = require("../controllers/fcmController");

// Save a device FCM token (after user grants notification permission)
router.post("/save-token", protect, fcmController.saveToken);

// Remove a device FCM token (e.g., on logout)
router.post("/remove-token", protect, fcmController.removeToken);

module.exports = router;
