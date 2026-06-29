const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure unique code per department
subjectSchema.index({ code: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
