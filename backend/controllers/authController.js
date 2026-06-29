const Admin = require("../models/Admin");
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Generate JWT Helper
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "futuristic_neon_secure_jwt_secret_key_2026", {
    expiresIn: "30d",
  });
};

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Please provide username and password" });
  }

  try {
    const admin = await Admin.findOne({ username });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(admin._id, admin.role),
        user: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student Login
// @route   POST /api/auth/student/login
// @access  Public
exports.studentLogin = async (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ success: false, message: "Please provide student ID and password" });
  }

  try {
    const student = await Student.findOne({ studentId });

    if (student && (await student.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(student._id, student.role),
        user: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          department: student.department,
          year: student.year,
          role: student.role,
          isPasswordResetRequired: student.isPasswordResetRequired,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid student ID or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password (Admin or Student)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Please fill all password fields" });
  }

  try {
    const role = req.user.role;
    let user;

    if (role === "admin") {
      user = await Admin.findById(req.user.id);
    } else if (role === "student") {
      user = await Student.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    if (role === "student") {
      user.isPasswordResetRequired = false;
    }

    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
