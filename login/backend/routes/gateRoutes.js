const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getActiveTrips,
  postTrip,
  bookTrip,
  cancelTrip,
  approveBooking,
  rejectBooking,
  getMyRequests,
} = require("../controllers/gateTripController");

// All routes are protected (JWT required)
router.get("/trips", protect, getActiveTrips);
router.post("/trips", protect, postTrip);
router.post("/trips/:id/book", protect, bookTrip);
router.patch("/trips/:id/cancel", protect, cancelTrip);

// Booking request approval routes
router.patch("/trips/:id/bookings/:bookingId/approve", protect, approveBooking);
router.patch("/trips/:id/bookings/:bookingId/reject", protect, rejectBooking);
router.get("/requests", protect, getMyRequests);

module.exports = router;
