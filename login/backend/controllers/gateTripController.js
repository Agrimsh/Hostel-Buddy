const GateTrip = require("../models/GateTrip");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// ── Email Templates ────────────────────────────────────────────────────────────

const tripPostedEmail = (pickerName, pickerRoom, price, slots, note) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 32px 24px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 8px;">🚪</div>
      <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px;">Gate Buddy Alert!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Someone's heading to the gate right now</p>
    </div>
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey there! 👋</p>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
        <strong style="color: #1e293b;">${pickerName}</strong> (Room ${pickerRoom}) is going to the gate and is ready to pick up orders for just <strong style="color: #6366f1;">₹${price}</strong>.
      </p>

      <div style="background: white; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Picker</td>
            <td style="color: #1e293b; font-weight: 700; font-size: 1rem; text-align: right;">${pickerName}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Room</td>
            <td style="color: #1e293b; font-weight: 700; text-align: right;">Room ${pickerRoom}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Price</td>
            <td style="color: #6366f1; font-weight: 800; font-size: 1.1rem; text-align: right;">₹${price}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Slots Available</td>
            <td style="color: #1e293b; font-weight: 700; text-align: right;">${slots}</td>
          </tr>
          ${note ? `<tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Note</td>
            <td style="color: #64748b; font-style: italic; text-align: right;">"${note}"</td>
          </tr>` : ""}
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(99,102,241,0.35);">
          📦 Book Now on Gate Buddy
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">
        Hostel Buddy · Your Campus Companion 🏠
      </p>
    </div>
  </div>
`;

const tripBookedEmail = (picker, booker, orderDetails, price) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 32px 24px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 8px;">✅</div>
      <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px;">You've Been Booked!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Someone just booked your gate trip</p>
    </div>
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${picker}! 🎉</p>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
        <strong style="color: #1e293b;">${booker}</strong> has booked your gate trip. Head to the gate, grab their order, and earn <strong style="color: #10b981;">₹${price}</strong>!
      </p>

      <div style="background: white; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">Order Details</p>
        <p style="color: #1e293b; font-size: 1rem; font-weight: 600; margin: 0; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #10b981;">
          ${orderDetails || "No additional details provided"}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Booked By</td>
            <td style="color: #1e293b; font-weight: 700; text-align: right;">${booker}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">You Earn</td>
            <td style="color: #10b981; font-weight: 800; font-size: 1.1rem; text-align: right;">₹${price}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fef3c7; border-radius: 10px; padding: 14px 18px; margin: 16px 0; border: 1px solid #fbbf24;">
        <p style="color: #92400e; font-size: 0.88rem; margin: 0; font-weight: 500;">
          ⏰ <strong>Head out soon!</strong> Your hostelmate is counting on you. Collect the order and deliver it to their room.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(16,185,129,0.35);">
          🚪 View Gate Buddy
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">
        Hostel Buddy · Your Campus Companion 🏠
      </p>
    </div>
  </div>
`;

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

    // ── Fire-and-forget: Email all other verified users ──────────────
    (async () => {
      try {
        const allUsers = await User.find({ isVerified: true, email: { $ne: pickerEmail } });
        const emailPromises = allUsers.map((u) =>
          sendEmail({
            email: u.email,
            subject: `🚪 ${pickerName} is going to the gate for ₹${price} — Book now!`,
            message: tripPostedEmail(pickerName, pickerRoom, price, slots, note),
          }).catch(() => {}) // Don't fail if one email fails
        );
        await Promise.all(emailPromises);
        console.log(`📧 Gate trip notification sent to ${allUsers.length} hostelmates`);
      } catch (err) {
        console.error("Failed to send gate trip emails:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to post trip" });
  }
};

// POST /api/gate/trips/:id/book — book a slot on a trip
const bookTrip = async (req, res) => {
  try {
    const { orderDetails } = req.body;
    const bookerEmail = req.user.email;
    const booker = bookerEmail.split("@")[0];

    const trip = await GateTrip.findById(req.params.id);
    if (!trip || trip.status !== "active") {
      return res.status(404).json({ success: false, message: "Trip not found or no longer active" });
    }

    if (trip.pickerEmail === bookerEmail) {
      return res.status(400).json({ success: false, message: "You cannot book your own trip" });
    }

    // Check if already booked
    const alreadyBooked = trip.bookings.some((b) => b.bookerEmail === bookerEmail);
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: "You have already booked this trip" });
    }

    if (trip.slotsLeft <= 0) {
      return res.status(400).json({ success: false, message: "No slots remaining" });
    }

    trip.bookings.push({ bookerEmail, booker, orderDetails: orderDetails || "" });
    trip.slotsLeft -= 1;
    if (trip.slotsLeft === 0) trip.status = "completed";

    await trip.save();
    res.status(200).json({ success: true, trip });

    // ── Fire-and-forget: Email the picker ───────────────────────────
    (async () => {
      try {
        await sendEmail({
          email: trip.pickerEmail,
          subject: `✅ ${booker} booked your gate trip — You earn ₹${trip.price}!`,
          message: tripBookedEmail(trip.pickerName, booker, orderDetails, trip.price),
        });
        console.log(`📧 Booking notification sent to picker ${trip.picker}`);
      } catch (err) {
        console.error("Failed to send booking email:", err.message);
      }
    })();
    // ────────────────────────────────────────────────────────────────

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to book trip" });
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
    await trip.save();
    res.status(200).json({ success: true, message: "Trip cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to cancel trip" });
  }
};

module.exports = { getActiveTrips, postTrip, bookTrip, cancelTrip };
