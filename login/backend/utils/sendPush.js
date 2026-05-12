const admin = require("firebase-admin");
const User = require("../models/User");

/**
 * Send a push notification to a specific user by their userId or email.
 *
 * @param {string} userIdentifier - userId (_id) or email of the target user
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {Object} data - Optional key-value data payload (all values must be strings)
 * @param {string} identifierType - "id" or "email" (default: "email")
 */
const sendPush = async (userIdentifier, title, body, data = {}, identifierType = "email") => {
  // Check if Firebase is initialized
  if (!admin.apps.length) {
    console.warn("⚠️ Firebase Admin not initialized. Skipping push notification.");
    return;
  }

  try {
    // Look up user to get their FCM tokens
    const query = identifierType === "id"
      ? { _id: userIdentifier }
      : { email: userIdentifier };

    const user = await User.findOne(query).select("fcmTokens email");

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userIdentifier}. Skipping push.`);
      return;
    }

    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }
    
    // Add title and body to the data payload
    // Sending ONLY data prevents FCM from auto-generating a background notification,
    // allowing our service worker to handle it manually exactly how we want.
    stringData.title = String(title);
    stringData.body = String(body);

    const message = {
      data: stringData,
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`🔔 Push sent to ${user.email}: ${response.successCount} success, ${response.failureCount} failed`);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          const code = resp.error.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(user.fcmTokens[idx]);
          }
        }
      });
      if (invalidTokens.length > 0) {
        await User.updateOne(
          { _id: user._id },
          { $pull: { fcmTokens: { $in: invalidTokens } } }
        );
        console.log(`🧹 Removed ${invalidTokens.length} invalid FCM tokens for ${user.email}`);
      }
    }
  } catch (error) {
    console.error(`❌ Push notification error for ${userIdentifier}:`, error.message);
  }
};

/**
 * Send a push notification to ALL verified users except the excluded email.
 */
const sendPushToAll = async (excludeEmail, title, body, data = {}) => {
  if (!admin.apps.length) {
    console.warn("⚠️ Firebase Admin not initialized. Skipping broadcast push.");
    return;
  }

  try {
    const users = await User.find({
      isVerified: true,
      email: { $ne: excludeEmail },
      fcmTokens: { $exists: true, $ne: [] },
    }).select("fcmTokens email");

    let totalSent = 0;
    for (const user of users) {
      await sendPush(user.email, title, body, data, "email");
      totalSent++;
    }
    console.log(`📢 Broadcast push sent to ${totalSent} users`);
  } catch (error) {
    console.error("❌ Broadcast push error:", error.message);
  }
};

module.exports = { sendPush, sendPushToAll };
