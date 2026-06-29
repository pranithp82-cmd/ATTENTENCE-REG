const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  getSubjects,
  createSubject,
} = require("../controllers/miscController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/departments")
  .get(protect, getDepartments)
  .post(protect, authorize("admin"), createDepartment);

router
  .route("/subjects")
  .get(protect, getSubjects)
  .post(protect, authorize("admin"), createSubject);

module.exports = router;
