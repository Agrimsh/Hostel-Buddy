const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
    },
    images: {
      type: [String],
      default: [], // Stores paths to uploaded images (supports multiple)
    },
    seller: {
      type: String,
      required: [true, "Seller username is required"],
    },
    name: {
      type: String,
      required: [true, "Seller name is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
