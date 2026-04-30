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
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 32px 24px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 8px;">📋</div>
      <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px;">New Booking Request!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Someone wants to book your gate trip</p>
    </div>
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${picker}! 👋</p>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
        <strong style="color: #1e293b;">${booker}</strong> has requested to book your gate trip for <strong style="color: #f59e0b;">₹${price}</strong>. Please review and <strong>accept or decline</strong> the request from the Gate Requests section.
      </p>

      <div style="background: white; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">Order Details</p>
        <p style="color: #1e293b; font-size: 1rem; font-weight: 600; margin: 0; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #f59e0b;">
          ${orderDetails || "No additional details provided"}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">Requested By</td>
            <td style="color: #1e293b; font-weight: 700; text-align: right;">${booker}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">You'll Earn</td>
            <td style="color: #f59e0b; font-weight: 800; font-size: 1.1rem; text-align: right;">₹${price}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fef3c7; border-radius: 10px; padding: 14px 18px; margin: 16px 0; border: 1px solid #fbbf24;">
        <p style="color: #92400e; font-size: 0.88rem; margin: 0; font-weight: 500;">
          ⏳ <strong>Action Required:</strong> Go to Gate Requests to accept or decline this booking. The booker is waiting for your response!
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="https://hostel-buddy373.vercel.app/gate-requests" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(245,158,11,0.35);">
          📋 Review Request in Gate Requests
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">
        Hostel Buddy · Your Campus Companion 🏠
      </p>
    </div>
  </div>
`;

const tripArrivedEmail = (picker, booker, room) => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px 32px 24px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 8px;">🏠</div>
      <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px;">Your Order has Arrived!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Please collect it from the picker's room</p>
    </div>
    <div style="padding: 28px 32px;">
      <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${booker}! 🎉</p>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
        <strong style="color: #1e293b;">${picker}</strong> has arrived back at the hostel with your order.
      </p>

      <div style="background: #eff6ff; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #bfdbfe;">
        <p style="color: #1e40af; font-size: 1.1rem; margin: 0; font-weight: 600; text-align: center;">
          📍 Collect from: <strong>Room ${room}</strong>
        </p>
      </div>

      <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; text-align: center;">
        Please go to their room to collect your order and make the payment as agreed.
      </p>

      <div style="text-align: center; margin: 28px 0 12px;">
        <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(59,130,246,0.35);">
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
          }).catch(() => { }) // Don't fail if one email fails
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

    // ── Fire-and-forget: Email the picker about new request ─────────
    (async () => {
      try {
        await sendEmail({
          email: trip.pickerEmail,
          subject: `📋 New booking request from ${booker}`,
          message: tripBookedEmail(trip.pickerName, booker, orderDetails, trip.price),
        });
        console.log(`📧 Booking request notification sent to picker ${trip.picker}`);
      } catch (err) {
        console.error("Failed to send booking email:", err.message);
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

    // ── Fire-and-forget: Notify booker of approval ──────────────────
    (async () => {
      try {
        const subject = `✅ ${trip.pickerName} approved your Gate Buddy request!`;
        const emailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 8px;">✅</div>
              <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800;">Request Approved!</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Your Gate Buddy booking has been approved</p>
            </div>
            <div style="padding: 28px 32px;">
              <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${booking.booker}! 🎉</p>
              <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
                <strong style="color: #1e293b;">${trip.pickerName}</strong> (Room ${trip.pickerRoom}) has approved your request. They'll pick up your order for <strong style="color: #10b981;">₹${trip.price}</strong>.
              </p>
              <div style="background: white; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">Order Details</p>
                <p style="color: #1e293b; font-size: 1rem; font-weight: 600; margin: 0; background: #f1f5f9; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #10b981;">
                  ${booking.orderDetails || "No additional details provided"}
                </p>
              </div>
              <div style="text-align: center; margin: 28px 0 12px;">
                <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(16,185,129,0.35);">
                  🚪 View Gate Buddy
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">Hostel Buddy · Your Campus Companion 🏠</p>
            </div>
          </div>
        `;
        await sendEmail({ email: booking.bookerEmail, subject, message: emailBody });
      } catch (err) {
        console.error("Failed to send approval email:", err.message);
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

    // ── Fire-and-forget: Notify booker of rejection ─────────────────
    (async () => {
      try {
        const subject = `❌ ${trip.pickerName} declined your Gate Buddy request`;
        const emailBody = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 8px;">❌</div>
              <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800;">Request Declined</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">Your Gate Buddy booking was not accepted</p>
            </div>
            <div style="padding: 28px 32px;">
              <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${booking.booker},</p>
              <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
                Unfortunately, <strong style="color: #1e293b;">${trip.pickerName}</strong> wasn't able to accept your request. Try booking another picker or check back later!
              </p>
              <div style="text-align: center; margin: 28px 0 12px;">
                <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(99,102,241,0.35);">
                  🔍 Find Another Picker
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">Hostel Buddy · Your Campus Companion 🏠</p>
            </div>
          </div>
        `;
        await sendEmail({ email: booking.bookerEmail, subject, message: emailBody });
      } catch (err) {
        console.error("Failed to send rejection email:", err.message);
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

    // ── Fire-and-forget: Notify booker of arrival ─────────────────
    (async () => {
      try {
        const subject = `🏠 Your order has arrived at Room ${trip.pickerRoom}!`;
        await sendEmail({
          email: booking.bookerEmail,
          subject,
          message: tripArrivedEmail(trip.pickerName, booking.booker, trip.pickerRoom)
        });
        console.log(`📧 Arrival notification sent to booker ${booking.booker}`);
      } catch (err) {
        console.error("Failed to send arrival email:", err.message);
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

    // ── Fire-and-forget: Notify bookers of trip cancellation ────────
    if (bookersToNotify.length > 0) {
      (async () => {
        try {
          const subject = `⚠️ Gate Buddy Trip Cancelled by ${trip.pickerName}`;
          const emailPromises = bookersToNotify.map((booker) => {
            const emailBody = `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: auto; background: #f8faff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px 32px 24px; text-align: center;">
                  <div style="font-size: 3rem; margin-bottom: 8px;">⚠️</div>
                  <h1 style="color: white; margin: 0; font-size: 1.6rem; font-weight: 800;">Trip Cancelled</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 0.95rem;">The picker has cancelled their trip to the gate.</p>
                </div>
                <div style="padding: 28px 32px;">
                  <p style="color: #475569; font-size: 1rem; margin-top: 0;">Hey ${booker.name},</p>
                  <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
                    Unfortunately, <strong style="color: #1e293b;">${trip.pickerName}</strong> had to cancel their trip to the gate, so your order request has been cancelled.
                  </p>
                  <p style="color: #475569; font-size: 1rem; line-height: 1.6;">
                    You can try booking another picker from the live feed!
                  </p>
                  <div style="text-align: center; margin: 28px 0 12px;">
                    <a href="https://hostel-buddy373.vercel.app/gate-buddy" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 1rem; box-shadow: 0 6px 20px rgba(99,102,241,0.35);">
                      🔍 Find Another Picker
                    </a>
                  </div>
                  <p style="color: #94a3b8; font-size: 0.8rem; text-align: center; margin-top: 24px;">Hostel Buddy · Your Campus Companion 🏠</p>
                </div>
              </div>
            `;
            return sendEmail({ email: booker.email, subject, message: emailBody });
          });
          await Promise.all(emailPromises);
          console.log(`📧 Trip cancellation emails sent to ${bookersToNotify.length} bookers`);
        } catch (err) {
          console.error("Failed to send cancellation emails:", err.message);
        }
      })();
    }
    // ────────────────────────────────────────────────────────────────
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to cancel trip" });
  }
};

module.exports = { getActiveTrips, postTrip, bookTrip, cancelTrip, approveBooking, rejectBooking, arriveBooking, getMyRequests };
