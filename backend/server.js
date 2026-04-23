require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

// Initialize app
const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Routes
app.use("/api/auth", authRoutes);

// Example of a protected route using authMiddleware
app.get("/api/dashboard", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the protected dashboard!",
    user: req.user, // decoded JWT payload
  });
});

// Basic Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something broke on the server!" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
