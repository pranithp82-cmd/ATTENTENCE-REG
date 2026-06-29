const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getAttendanceHistory,
  getStudentStats,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(protect, authorize("admin"), markAttendance)
  .get(protect, authorize("admin", "student"), getAttendanceHistory);

router.get("/student/:studentId", protect, authorize("admin", "student"), getStudentStats);

module.exports = router;
