const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: String, // Stored as 'YYYY-MM-DD' for exact day filtering
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
    },
    recordedBy: {
      type: String, // String username or Admin ObjectId ref
      required: true,
    },
  },
  { timestamps: true }
);

// Optimize search speed using a compound index for fast history retrieval
attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
