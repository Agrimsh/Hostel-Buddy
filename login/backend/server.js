require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const gateRoutes = require("./routes/gateRoutes");
const fcmRoutes = require("./routes/fcmRoutes");
const { protect } = require("./middleware/authMiddleware");
const Message = require("./models/Message");
const admin = require("firebase-admin");

// ── Initialize Firebase Admin SDK ────────────────────────────────────────────
// Store the entire service account JSON as an env var: FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("🔥 Firebase Admin init error:", error.message);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not set. Push notifications disabled.");
}

// Initialize app
const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: "*", // Allow all origins (you can restrict this in production)
}));
app.use(express.json()); // Parses incoming JSON requests

// Routes
const itemRoutes = require("./routes/itemRoutes");
const path = require("path");

// Uploads are now handled by Cloudinary

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/gate", gateRoutes);
app.use("/api/fcm", fcmRoutes);
app.use("/api/profile", require("./routes/profileRoutes"));

// Example of a protected route using authMiddleware
app.get("/api/dashboard", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the protected dashboard!",
    user: req.user, // decoded JWT payload
  });
});

// Route to keep the server awake (for free hosting tiers like Render)
app.get("/api/ping", (req, res) => {
  res.status(200).json({ success: true, message: "Server is awake!" });
});

const User = require("./models/User");
const { sendPush } = require("./utils/sendPush");

// ─── Socket.io Real-Time Chat ────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // User joins their personal room so they can receive messages
  socket.on("joinRoom", (username) => {
    socket.join(`user_${username}`);
    console.log(`📥 ${username} joined room user_${username}`);
  });

  // Handle incoming messages
  socket.on("sendMessage", async (data) => {
    try {
      const { sender, receiver, message, itemId, itemTitle } = data;

      // Persist to MongoDB
      const newMessage = await Message.create({
        sender,
        receiver,
        message,
        itemId,
        itemTitle: itemTitle || "",
      });

      // Emit to receiver's room
      io.to(`user_${receiver}`).emit("receiveMessage", newMessage);
      // Also emit back to sender's room (for multi-tab sync)
      io.to(`user_${sender}`).emit("receiveMessage", newMessage);

      // --- Send Push Notification to Receiver (instead of email) ---
      // Fire and forget so we don't block the socket response
      (async () => {
        try {
          // receiver is usually just the username (part before @). Find their full email.
          const receiverUser = await User.findOne({ email: new RegExp(`^${receiver}@`, "i") });
          if (receiverUser) {
            await sendPush(
              receiverUser.email,
              `💬 New message from ${sender}`,
              `${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`,
              { type: "chat", itemId: itemId || "", itemTitle: itemTitle || "" },
              "email"
            );
          }
        } catch (pushErr) {
          console.error("Error sending push notification:", pushErr);
        }
      })();
      // -------------------------------------------

    } catch (error) {
      console.error("Socket sendMessage error:", error);
    }
  });

  // ── Gate Buddy real-time events ──────────────────────────────
  // Picker goes live → broadcast to all connected users
  socket.on("gateTripPosted", (trip) => {
    io.emit("newGateTrip", trip);
    console.log(`🚪 New gate trip by ${trip.picker}`);
  });

  // Someone books a slot → broadcast updated trip
  socket.on("gateTripBooked", (trip) => {
    io.emit("gateTripUpdated", trip);
    console.log(`📦 Trip ${trip._id} booked — ${trip.slotsLeft} slots left`);
  });

  // Picker cancels → broadcast removal
  socket.on("gateTripCancelled", (tripId) => {
    io.emit("gateTripRemoved", tripId);
    console.log(`❌ Gate trip ${tripId} cancelled`);
  });
  // ─────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Basic Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something broke on the server!" });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
