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
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Routes
const itemRoutes = require("./routes/itemRoutes");
const path = require("path");

// Serve static files from 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
