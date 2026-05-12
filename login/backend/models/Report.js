const mongoose = require("mongoose");

/**
 * Report schema:
 * Represents a user-submitted complaint about another user or item.
 */
const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: String, // email of the person filing the report
      required: true,
    },
    reporterName: {
      type: String,
      default: "",
    },
    // What is being reported: "user" or "item" or "gate_trip"
    type: {
      type: String,
      enum: ["user", "item", "gate_trip"],
      required: true,
    },
    // The reported entity's ID (userId, itemId, or gateTripId)
    reportedId: {
      type: String,
      required: true,
    },
    // Display info about the reported entity
    reportedName: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["spam", "fraud", "inappropriate", "harassment", "safety", "other"],
      default: "other",
    },
    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    // Resolution status
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
