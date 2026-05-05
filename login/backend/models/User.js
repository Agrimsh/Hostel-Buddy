const mongoose = require("mongoose");

/**
 * User schema:
 *  - email: unique college email
 *  - isVerified: set to true once OTP is validated
 *  - otp: bcrypt-hashed OTP (never stored in plain text)
 *  - otpExpiry: Date object for the 5-minute window
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Stores the bcrypt hash of the OTP — never the raw value
    otp: {
      type: String,
      default: null,
    },
    // Unix timestamp (ms); OTP is invalid after this point
    otpExpiry: {
      type: Date,
      default: null,
    },
    // Array of Firebase Cloud Messaging device tokens for push notifications
    fcmTokens: [
      {
        type: String,
      },
    ],
    // UPI ID for Gate Buddy payment (e.g. "user@upi" or "9876543210@paytm")
    upiId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
