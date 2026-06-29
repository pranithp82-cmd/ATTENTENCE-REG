const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// @desc    Mark daily attendance for a batch of students
// @route   POST /api/attendance
// @access  Private/Admin
exports.markAttendance = async (req, res) => {
  const { date, department, year, subject, records } = req.body;

  if (!date || !department || !year || !subject || !records || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: "Invalid payload. Provide date, department, year, subject, and student records" });
  }

  try {
    const recordedBy = req.user.username || "Admin";

    const promises = records.map(async (record) => {
      // Upsert: Find and update status, or insert if it doesn't exist
      return Attendance.findOneAndUpdate(
        {
          student: record.studentId,
          date,
          subject,
        },
        {
          status: record.status,
          department,
          year: parseInt(year, 10),
          recordedBy,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    await Promise.all(promises);

    res.json({ success: true, message: `Attendance marked successfully for ${records.length} students` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance history with advanced filters
// @route   GET /api/attendance
// @access  Private (Admin can view all, Student can only view their own)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, department, year, subject, studentId } = req.query;

    const query = {};

    // 1. Role Check
    if (req.user.role === "student") {
      query.student = req.user._id;
    } else if (studentId) {
      // Admin wants to filter by student
      query.student = studentId;
    }

    // 2. Date Filtering
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // 3. Metadata Filters
    if (department && department !== "All") {
      query.department = department;
    }
    if (year && year !== "All") {
      query.year = parseInt(year, 10);
    }
    if (subject && subject !== "All") {
      query.subject = subject;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("student", "name studentId email department year")
      .sort({ date: -1, subject: 1 });

    res.json({ success: true, count: attendanceRecords.length, data: attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance stats for a specific student (overall and subject-wise)
// @route   GET /api/attendance/student/:studentId
// @access  Private (Admin or Student owner)
exports.getStudentStats = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Security check: Student can only view their own stats
    if (req.user.role === "student" && req.user._id.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const records = await Attendance.find({ student: student._id });

    const total = records.length;
    const present = records.filter((r) => r.status === "Present").length;
    const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 100.0;

    // Calculate subject-wise breakdown
    const subjectBreakdown = {};
    records.forEach((record) => {
      if (!subjectBreakdown[record.subject]) {
        subjectBreakdown[record.subject] = { total: 0, present: 0 };
      }
      subjectBreakdown[record.subject].total += 1;
      if (record.status === "Present") {
        subjectBreakdown[record.subject].present += 1;
      }
    });

    const subjects = Object.keys(subjectBreakdown).map((sub) => {
      const sTotal = subjectBreakdown[sub].total;
      const sPresent = subjectBreakdown[sub].present;
      return {
        subject: sub,
        total: sTotal,
        present: sPresent,
        percentage: parseFloat(((sPresent / sTotal) * 100).toFixed(2)),
      };
    });

    res.json({
      success: true,
      stats: {
        total,
        present,
        absent: total - present,
        percentage,
        subjects,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
