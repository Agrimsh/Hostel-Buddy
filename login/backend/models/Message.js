const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: [true, "Sender is required"],
      trim: true,
    },
    receiver: {
      type: String,
      required: [true, "Receiver is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
    },
    itemId: {
      type: String,
      required: [true, "Item ID is required"],
    },
    itemTitle: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for fast history queries
messageSchema.index({ sender: 1, receiver: 1, itemId: 1 });

module.exports = mongoose.model("Message", messageSchema);
