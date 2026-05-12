const User = require("../models/User");
const Item = require("../models/Item");
const GateTrip = require("../models/GateTrip");

/**
 * @desc    Get all students with search/filter
 * @route   GET /api/admin/students
 * @access  Admin
 */
const getStudents = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: "student" };

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const students = await User.find(query)
      .select("-otp -otpExpiry -fcmTokens")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("getStudents error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

/**
 * @desc    Ban a student
 * @route   PATCH /api/admin/students/:id/ban
 * @access  Admin
 */
const banStudent = async (req, res) => {
  try {
    // Note: if 'id' is a string like email instead of ObjectId, we might need to handle it.
    // In our UI, we pass row._id to handleBan for normal ban, and row.picker (email) for block user in GateBuddy.
    let user;
    if (req.params.id.includes('@')) {
      user = await User.findOneAndUpdate({ email: req.params.id }, { isBanned: true }, { new: true });
    } else {
      user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    }

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User banned successfully", user });
  } catch (error) {
    console.error("banStudent error:", error);
    res.status(500).json({ success: false, message: "Failed to ban student" });
  }
};

/**
 * @desc    Unban a student
 * @route   PATCH /api/admin/students/:id/unban
 * @access  Admin
 */
const unbanStudent = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User unbanned successfully", user });
  } catch (error) {
    console.error("unbanStudent error:", error);
    res.status(500).json({ success: false, message: "Failed to unban student" });
  }
};

/**
 * @desc    Get all marketplace listings with search
 * @route   GET /api/admin/marketplace
 * @access  Admin
 */
const getMarketplaceListings = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { seller: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("getMarketplaceListings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch listings" });
  }
};

/**
 * @desc    Remove a marketplace listing
 * @route   DELETE /api/admin/marketplace/:id
 * @access  Admin
 */
const removeItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    res.status(200).json({ success: true, message: "Item removed successfully" });
  } catch (error) {
    console.error("removeItem error:", error);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

/**
 * @desc    Mark a listing as fake/duplicate
 * @route   PATCH /api/admin/marketplace/:id/mark-fake
 * @access  Admin
 */
const markListingFake = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, { isFake: true }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    res.status(200).json({ success: true, message: "Item marked as fake" });
  } catch (error) {
    console.error("markListingFake error:", error);
    res.status(500).json({ success: false, message: "Failed to mark item as fake" });
  }
};


/**
 * @desc    Get all gate trips with search
 * @route   GET /api/admin/gate-trips
 * @access  Admin
 */
const getGateTrips = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const trips = await GateTrip.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.status(200).json({ success: true, trips });
  } catch (error) {
    console.error("getGateTrips error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch gate trips" });
  }
};

/**
 * @desc    Delete a gate request
 * @route   DELETE /api/admin/gate-trips/:id
 * @access  Admin
 */
const deleteGateRequest = async (req, res) => {
  try {
    const trip = await GateTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: "Request not found" });

    res.status(200).json({ success: true, message: "Request deleted successfully" });
  } catch (error) {
    console.error("deleteGateRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to delete request" });
  }
};


module.exports = {
  getStudents,
  banStudent,
  unbanStudent,
  getMarketplaceListings,
  removeItem,
  markListingFake,
  getGateTrips,
  deleteGateRequest
};
