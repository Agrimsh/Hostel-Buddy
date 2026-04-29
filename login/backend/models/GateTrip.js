const mongoose = require("mongoose");

/**
 * GateTrip schema:
 * Represents a "going to gate" post by a hostler (picker).
 * Other users can book slots on this trip.
 */
const gateTripSchema = new mongoose.Schema(
  {
    picker: {
      type: String, // email username (part before @)
      required: true,
    },
    pickerEmail: {
      type: String,
      required: true,
    },
    pickerName: {
      type: String,
      required: true,
      trim: true,
    },
    pickerRoom: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    slots: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    slotsLeft: {
      type: Number,
    },
    note: {
      type: String,
      default: "",
      maxlength: 200,
    },
    // "active" | "completed" | "cancelled"
    status: {
      type: String,
      default: "active",
    },
    // Array of bookings
    bookings: [
      {
        bookerEmail: String,
        booker: String,       // username
        orderDetails: String, // e.g. "Swiggy order, blue bag"
        bookedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-set slotsLeft before saving
gateTripSchema.pre("save", function (next) {
  if (this.isNew) {
    this.slotsLeft = this.slots;
  }
  next();
});

module.exports = mongoose.model("GateTrip", gateTripSchema);
