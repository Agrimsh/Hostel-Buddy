const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/", protect, profileController.getProfile);
router.patch("/upi", protect, profileController.updateUpi);

module.exports = router;
