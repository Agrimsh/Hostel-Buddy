const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const {
  getStudents,
  banStudent,
  unbanStudent,
  getMarketplaceListings,
  removeItem,
  markListingFake,
  getGateTrips,
  deleteGateRequest
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect);
router.use(requireAdmin);

// Students / Users
router.get("/students", getStudents);
router.patch("/students/:id/ban", banStudent);
router.patch("/students/:id/unban", unbanStudent);

// Marketplace
router.get("/marketplace", getMarketplaceListings);
router.delete("/marketplace/:id", removeItem);
router.patch("/marketplace/:id/mark-fake", markListingFake);

// Gate Trips
router.get("/gate-trips", getGateTrips);
router.delete("/gate-trips/:id", deleteGateRequest);

module.exports = router;
