const User = require("../models/User");

/**
 * Middleware to restrict access to admin/warden roles only.
 * Must be used AFTER the `protect` middleware (which sets req.user from JWT).
 */
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "admin" && user.role !== "warden") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Warden role required.",
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    res.status(500).json({ success: false, message: "Server error checking admin access" });
  }
};

module.exports = { requireAdmin };
