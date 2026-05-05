const User = require("../models/User");

/**
 * GET /api/profile — get current user's profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("email upiId isVerified");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      profile: {
        email: user.email,
        upiId: user.upiId || "",
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * PATCH /api/profile/upi — save/update UPI ID
 */
exports.updateUpi = async (req, res) => {
  try {
    const { upiId } = req.body;

    if (upiId === undefined) {
      return res.status(400).json({ success: false, message: "UPI ID is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { upiId: upiId.trim() },
      { new: true }
    ).select("email upiId");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "UPI ID updated successfully",
      upiId: user.upiId,
    });
  } catch (error) {
    console.error("Error updating UPI ID:", error);
    res.status(500).json({ success: false, message: "Failed to update UPI ID" });
  }
};
