const GateTrip = require("../models/GateTrip");
const User = require("../models/User");
const { sendPush, sendPushToAll } = require("../utils/sendPush");

// ── Controllers ────────────────────────────────────────────────────────────────

// GET /api/gate/trips — all active trips
const getActiveTrips = async (req, res) => {
  try {
    const trips = await GateTrip.find({ status: "active" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, trips });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch trips" });
  }
};

// POST /api/gate/trips — post a new trip (picker)
const postTrip = async (req, res) => {
  try {
    const { price, slots, note, pickerName, pickerRoom } = req.body;
    const pickerEmail = req.user.email;
    const picker = pickerEmail.split("@")[0];

    if (!price || !slots) {
      return res.status(400).json({ success: false, message: "Price and slots are required" });
    }
    if (!pickerName || !pickerRoom) {
      return res.status(400).json({ success: false, message: "Name and room number are required" });
    }

    // Only allow one active trip per picker at a time
    const existing = await GateTrip.findOne({ pickerEmail, status: "active" });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already have an active trip posted" });
    }

    const trip = await GateTrip.create({ picker, pickerEmail, pickerName, pickerRoom, price, slots, note });
    res.status(201).json({ success: true, trip });

    // ── Fire-and-forget: Push notify all other verified users ─────
    (async () => {
      try {
        await sendPushToAll(
          pickerEmail,
          `🚪 ${pickerName} is heading to the gate!`,
          `Going to the gate for ₹${price}. ${slots} slot(s) available.${note ? ` Note: ${note}` : ""}`,
          { type: "gate_trip_posted", tripId: trip._id.toString() }
        );
      } catch (err) {
        console.error("Failed to send gate trip push notifications:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to post trip" });
  }
};

// POST /api/gate/trips/:id/book — book a slot on a trip (creates PENDING request)
const bookTrip = async (req, res) => {
  try {
    const { orderDetails, bookerName, bookerRoom, orderPrice } = req.body;
    const bookerEmail = req.user.email;
    const booker = bookerEmail.split("@")[0];

    if (!bookerName || !bookerRoom || !orderDetails || orderPrice === undefined) {
      return res.status(400).json({ success: false, message: "Name, room, order details, and order price are required" });
    }

    const trip = await GateTrip.findById(req.params.id);
    if (!trip || trip.status !== "active") {
      return res.status(404).json({ success: false, message: "Trip not found or no longer active" });
    }

    if (trip.pickerEmail === bookerEmail) {
      return res.status(400).json({ success: false, message: "You cannot book your own trip" });
    }

    // Check if already booked (any status)
    const alreadyBooked = trip.bookings.some((b) => b.bookerEmail === bookerEmail);
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: "You have already booked this trip" });
    }

    if (trip.slotsLeft <= 0) {
      return res.status(400).json({ success: false, message: "No slots remaining" });
    }

    // Create a PENDING booking — slots are NOT decremented yet
    trip.bookings.push({ bookerEmail, booker, bookerName, bookerRoom, orderDetails, orderPrice, status: "PENDING" });

    await trip.save();
    res.status(200).json({ success: true, trip });

    // ── Fire-and-forget: Push notify the picker about new request ──
    (async () => {
      try {
        await sendPush(
          trip.pickerEmail,
          `📋 New booking request from ${bookerName}`,
          `${bookerName} wants you to pick up: ${orderDetails.substring(0, 80)}${orderDetails.length > 80 ? "..." : ""}`,
          { type: "booking_request", tripId: trip._id.toString() },
          "email"
        );
      } catch (err) {
        console.error("Failed to send booking push:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to book trip" });
  }
};

// PATCH /api/gate/trips/:id/bookings/:bookingId/approve — picker approves a booking
const approveBooking = async (req, res) => {
  try {
    const pickerEmail = req.user.email;
    const trip = await GateTrip.findById(req.params.id);

    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.pickerEmail !== pickerEmail) {
      return res.status(403).json({ success: false, message: "Only the picker can approve bookings" });
    }

    const booking = trip.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Booking already ${booking.status.toLowerCase()}` });
    }

    if (trip.slotsLeft <= 0) {
      return res.status(400).json({ success: false, message: "No slots remaining to approve" });
    }

    booking.status = "APPROVED";
    trip.slotsLeft -= 1;
    if (trip.slotsLeft === 0) trip.status = "completed";

    await trip.save();
    res.status(200).json({ success: true, trip });

    // ── Fire-and-forget: Push notify booker of approval ────────────
    (async () => {
      try {
        await sendPush(
          booking.bookerEmail,
          `✅ ${trip.pickerName} approved your request!`,
          `Your order will be picked up from the gate. Price: ₹${trip.price}. Collect from Room ${trip.pickerRoom} when they arrive.`,
          { type: "booking_approved", tripId: trip._id.toString() },
          "email"
        );
      } catch (err) {
        console.error("Failed to send approval push:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve booking" });
  }
};

// PATCH /api/gate/trips/:id/bookings/:bookingId/reject — picker rejects a booking
const rejectBooking = async (req, res) => {
  try {
    const pickerEmail = req.user.email;
    const trip = await GateTrip.findById(req.params.id);

    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.pickerEmail !== pickerEmail) {
      return res.status(403).json({ success: false, message: "Only the picker can reject bookings" });
    }

    const booking = trip.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: `Booking already ${booking.status.toLowerCase()}` });
    }

    booking.status = "REJECTED";
    await trip.save();
    res.status(200).json({ success: true, trip });

    // ── Fire-and-forget: Push notify booker of rejection ───────────
    (async () => {
      try {
        await sendPush(
          booking.bookerEmail,
          `❌ ${trip.pickerName} declined your request`,
          `Unfortunately, your Gate Buddy request was declined. Try booking another picker!`,
          { type: "booking_rejected", tripId: trip._id.toString() },
          "email"
        );
      } catch (err) {
        console.error("Failed to send rejection push:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject booking" });
  }
};

// PATCH /api/gate/trips/:id/bookings/:bookingId/arrive — picker marks a booking as arrived
const arriveBooking = async (req, res) => {
  try {
    const pickerEmail = req.user.email;
    const trip = await GateTrip.findById(req.params.id);

    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.pickerEmail !== pickerEmail) {
      return res.status(403).json({ success: false, message: "Only the picker can mark bookings as arrived" });
    }

    const booking = trip.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (booking.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: `Cannot mark ${booking.status.toLowerCase()} booking as arrived. Must be approved first.` });
    }

    booking.status = "ARRIVED";
    // Complete the overall trip so it disappears from the live feed
    trip.status = "completed";
    await trip.save();
    res.status(200).json({ success: true, trip });

    // ── Fire-and-forget: Push notify booker of arrival ─────────────
    (async () => {
      try {
        await sendPush(
          booking.bookerEmail,
          `🏠 Your order has arrived!`,
          `${trip.pickerName} is back! Collect your order from Room ${trip.pickerRoom} and pay ₹${trip.price}.`,
          { type: "order_arrived", tripId: trip._id.toString() },
          "email"
        );
      } catch (err) {
        console.error("Failed to send arrival push:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark booking as arrived" });
  }
};

// GET /api/gate/requests — get all bookings relevant to the logged-in user
const getMyRequests = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const username = userEmail.split("@")[0];

    // Find active/completed trips where user is picker or booker
    const trips = await GateTrip.find({
      status: { $in: ["active", "completed"] },
      $or: [
        { pickerEmail: userEmail },
        { "bookings.bookerEmail": userEmail },
      ],
    }).sort({ createdAt: -1 });

    // Collect unique picker emails to look up UPI IDs
    const pickerEmails = [...new Set(trips.map((t) => t.pickerEmail))];
    const pickerUsers = await User.find({ email: { $in: pickerEmails } }).select("email upiId");
    const upiMap = {};
    pickerUsers.forEach((u) => { upiMap[u.email] = u.upiId || ""; });

    // Flatten into request objects
    const requests = [];
    for (const trip of trips) {
      for (const b of trip.bookings) {
        // Include if user is the picker (incoming) or the booker (outgoing)
        if (trip.pickerEmail === userEmail || b.bookerEmail === userEmail) {
          requests.push({
            tripId: trip._id,
            bookingId: b._id,
            picker: trip.picker,
            pickerName: trip.pickerName,
            pickerRoom: trip.pickerRoom,
            pickerUpiId: upiMap[trip.pickerEmail] || "",
            price: trip.price,
            booker: b.booker,
            bookerName: b.bookerName,
            bookerRoom: b.bookerRoom,
            bookerEmail: b.bookerEmail,
            orderDetails: b.orderDetails,
            orderPrice: b.orderPrice,
            bookedAt: b.bookedAt,
            status: b.status,
            tripStatus: trip.status,
            role: trip.pickerEmail === userEmail ? "picker" : "booker",
          });
        }
      }
    }

    // Sort newest first
    requests.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

    res.status(200).json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
};

// PATCH /api/gate/trips/:id/cancel — picker cancels their trip
const cancelTrip = async (req, res) => {
  try {
    const pickerEmail = req.user.email;
    const trip = await GateTrip.findById(req.params.id);

    if (!trip) return res.status(404).json({ success: false, message: "Trip not found" });
    if (trip.pickerEmail !== pickerEmail) {
      return res.status(403).json({ success: false, message: "Not your trip" });
    }

    trip.status = "cancelled";
    // For any bookings that weren't already rejected, mark them as rejected and notify
    const bookersToNotify = [];
    for (const b of trip.bookings) {
      if (b.status !== "REJECTED") {
        b.status = "REJECTED";
        bookersToNotify.push({ email: b.bookerEmail, name: b.bookerName || b.booker });
      }
    }

    await trip.save();
    res.status(200).json({ success: true, message: "Trip cancelled" });

    // ── Fire-and-forget: Push notify bookers of trip cancellation ──
    if (bookersToNotify.length > 0) {
      (async () => {
        try {
          const pushPromises = bookersToNotify.map((booker) =>
            sendPush(
              booker.email,
              `⚠️ Trip cancelled by ${trip.pickerName}`,
              `${trip.pickerName} cancelled their gate trip. Your booking has been cancelled. Try finding another picker!`,
              { type: "trip_cancelled", tripId: trip._id.toString() },
              "email"
            ).catch(() => {})
          );
          await Promise.all(pushPromises);
          console.log(`🔔 Cancellation push sent to ${bookersToNotify.length} bookers`);
        } catch (err) {
          console.error("Failed to send cancellation pushes:", err.message);
        }
      })();
    }
    // ────────────────────────────────────────────────────────────────
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to cancel trip" });
  }
};

module.exports = { getActiveTrips, postTrip, bookTrip, cancelTrip, approveBooking, rejectBooking, arriveBooking, getMyRequests };
