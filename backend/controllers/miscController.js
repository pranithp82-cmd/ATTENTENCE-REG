const Department = require("../models/Department");
const Subject = require("../models/Subject");

// @desc    Get all departments
// @route   GET /api/misc/departments
// @access  Private (Admin or Student)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a department
// @route   POST /api/misc/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: "Please provide name and code" });
  }

  try {
    const deptExists = await Department.findOne({ $or: [{ name }, { code }] });
    if (deptExists) {
      return res.status(400).json({ success: false, message: "Department name or code already exists" });
    }

    const department = await Department.create({ name, code });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subjects (optionally filtered by department)
// @route   GET /api/misc/subjects
// @access  Private (Admin or Student)
exports.getSubjects = async (req, res) => {
  try {
    const { department } = req.query;
    const query = {};

    if (department) {
      query.department = department;
    }

    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/misc/subjects
// @access  Private/Admin
exports.createSubject = async (req, res) => {
  const { name, code, department } = req.body;

  if (!name || !code || !department) {
    return res.status(400).json({ success: false, message: "Please provide name, code, and department" });
  }

  try {
    const subExists = await Subject.findOne({ code, department });
    if (subExists) {
      return res.status(400).json({ success: false, message: "Subject code already exists in this department" });
    }

    const subject = await Subject.create({ name, code, department });
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
