const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @desc    Request OTP (Send OTP to email)
 * @route   POST /auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // 1. Validate domain (e.g., must be a .edu or .ac.in domain)
    if (!email.toLowerCase().endsWith("gmail.com")) {
      return res
        .status(400)
        .json({ success: false, message: "Only valid gmail ids" });
    }

    // 2. See if user exists, else create new one
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    // 3. Generate raw 6-digit OTP
    const otp = generateOtp();

    // 4. Hash OTP with bcrypt BEFORE saving to DB
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // 5. Store hashed OTP and expiry (5 mins from now)
    user.otp = hashedOtp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // 6. Send OTP to user's email
    const message = `
      <h2>Hostel Buddy Login</h2>
      <p>Your OTP for verification is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Hostel Buddy Verification Code",
      message,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("sendOtp Error:", error);
    res.status(500).json({ success: false, message: "Server error during sending OTP" });
  }
};

/**
 * @desc    Verify OTP and login (Issue JWT)
 * @route   POST /auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Check if OTP is still valid (not expired)
    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    // 3. Compare provided OTP with stored bcrypt hash
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // 4. On success: Mark as verified and clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // 5. Generate JWT token (valid for 7 days)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("verifyOtp Error:", error);
    res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
