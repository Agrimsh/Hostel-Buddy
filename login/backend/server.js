require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { protect } = require("./middleware/authMiddleware");
const Message = require("./models/Message");

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
  origin: "*"
}));
app.use(express.json()); // Parses incoming JSON requests

// Routes
const itemRoutes = require("./routes/itemRoutes");
const path = require("path");

// Uploads are now handled by Cloudinary

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/chat", chatRoutes);

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
const sendEmail = require("./utils/sendEmail");

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

      // --- Send Email Notification to Receiver ---
      // Fire and forget so we don't block the socket response
      (async () => {
        try {
          // receiver is usually just the username (part before @). Let's find their full email.
          const receiverUser = await User.findOne({ email: new RegExp(`^${receiver}@`, "i") });
          if (receiverUser) {
            const subject = `1 new message from ${sender}`;
            const emailBody = `
              <h2>Hostel Buddy Notification</h2>
              <p>You have <strong>1 new message</strong> from <strong>${sender}</strong>.</p>
              <p><strong>Item:</strong> ${itemTitle || "Unknown Item"}</p>
              <p><strong>Message:</strong></p>
              <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin-left: 0; font-style: italic;">
                ${message}
              </blockquote>
              <br/>
              <p><a href="https://hostel-buddy373.vercel.app/inbox" style="padding: 10px 15px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Go to Inbox to Reply</a></p>
            `;
            await sendEmail({
              email: receiverUser.email,
              subject,
              message: emailBody,
            });
          }
        } catch (emailErr) {
          console.error("Error sending email notification:", emailErr);
        }
      })();
      // -------------------------------------------

    } catch (error) {
      console.error("Socket sendMessage error:", error);
    }
  });

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
