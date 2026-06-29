const Student = require("../models/Student");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const bcrypt = require("bcryptjs");

// Helper to generate a unique Student ID (e.g., CS2026001)
const generateStudentId = async (departmentName, yearVal) => {
  try {
    // 1. Get Department Code (CS, EE, etc.)
    const dept = await Department.findOne({ name: departmentName });
    const code = dept ? dept.code : "ST"; // fallback to ST if department not found

    // 2. Get Current Year (or class year)
    const currentYear = new Date().getFullYear().toString();

    // 3. Find latest student with ID matching prefix (e.g., CS2026)
    const prefix = `${code}${currentYear}`;
    const regex = new RegExp(`^${prefix}\\d{3}$`);

    const latestStudent = await Student.findOne({ studentId: regex })
      .sort({ studentId: -1 })
      .exec();

    let seq = 1;
    if (latestStudent) {
      // Extract sequence suffix and increment it
      const suffix = latestStudent.studentId.substring(prefix.length);
      seq = parseInt(suffix, 10) + 1;
    }

    // Pad with zeroes (e.g. 001, 002...)
    const paddedSeq = seq.toString().padStart(3, "0");
    return `${prefix}${paddedSeq}`;
  } catch (error) {
    console.error("ID Generation Error:", error);
    // Return standard random fallback if fail
    return `ST${Date.now().toString().slice(-6)}`;
  }
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = async (req, res) => {
  const { name, email, department, year } = req.body;

  if (!name || !email || !department || !year) {
    return res.status(400).json({ success: false, message: "Please fill all fields" });
  }

  try {
    // Check if email already exists
    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Generate unique Student ID
    const studentId = await generateStudentId(department, year);

    // Default temporary password is same as Student ID or a fixed string
    const tempPassword = `Temp@${studentId}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const student = await Student.create({
      studentId,
      name,
      email,
      password: hashedPassword,
      department,
      year: parseInt(year, 10),
      isPasswordResetRequired: true, // Force change on first login
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        temporaryPassword: tempPassword, // Send back so admin can provide it to the student
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students (with search, filter, and pagination)
// @route   GET /api/students
// @access  Private/Admin
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, year } = req.query;

    const query = {};

    // Apply search filter (name or studentId)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    // Apply department filter
    if (department && department !== "All") {
      query.department = department;
    }

    // Apply year filter
    if (year && year !== "All") {
      query.year = parseInt(year, 10);
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ studentId: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: students,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private (Admin or Student owner)
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Security check: Students can only access their own profile
    if (req.user.role === "student" && req.user._id.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
  const { name, email, department, year } = req.body;

  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // If email is changing, check uniqueness
    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const emailExists = await Student.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email is already taken" });
      }
      student.email = email;
    }

    student.name = name || student.name;
    student.department = department || student.department;
    student.year = year ? parseInt(year, 10) : student.year;

    const updatedStudent = await student.save();

    res.json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete student profile and attendance records
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Delete attendance history
    await Attendance.deleteMany({ student: student._id });

    // Delete student
    await Student.findByIdAndDelete(student._id);

    res.json({ success: true, message: "Student and attendance records deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset student password to temporary password
// @route   POST /api/students/:id/reset-password
// @access  Private/Admin
exports.resetStudentPassword = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const tempPassword = `Reset@${student.studentId}`;
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(tempPassword, salt);
    student.isPasswordResetRequired = true; // force change on login

    await student.save();

    res.json({
      success: true,
      message: "Password reset completed successfully",
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
