const User = require("../models/User");

/**
 * Save an FCM device token for the authenticated user.
 * POST /api/fcm/save-token
 * Body: { token: "..." }
 */
exports.saveToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId; // from JWT decode in authMiddleware

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Only add if it doesn't already exist
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
      console.log(`🔔 FCM token saved for ${user.email}`);
    }

    res.status(200).json({ success: true, message: "FCM token saved" });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    res.status(500).json({ success: false, message: "Failed to save FCM token" });
  }
};

/**
 * Remove an FCM device token (e.g., on logout).
 * POST /api/fcm/remove-token
 * Body: { token: "..." }
 */
exports.removeToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } }
    );

    res.status(200).json({ success: true, message: "FCM token removed" });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    res.status(500).json({ success: false, message: "Failed to remove FCM token" });
  }
};
