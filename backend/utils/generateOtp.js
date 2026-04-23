/**
 * generateOtp.js
 * Generates a cryptographically random 6-digit OTP.
 * Uses crypto module to avoid predictable Math.random().
 */
const crypto = require("crypto");

const generateOtp = () => {
  // Generate a random number between 100000 and 999999 (inclusive)
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
};

module.exports = generateOtp;
