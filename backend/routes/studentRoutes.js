const express = require("express");
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

// Admin CRUD
router
  .route("/")
  .post(protect, authorize("admin"), createStudent)
  .get(protect, authorize("admin"), getStudents);

router
  .route("/:id")
  .get(protect, authorize("admin", "student"), getStudentById)
  .put(protect, authorize("admin"), updateStudent)
  .delete(protect, authorize("admin"), deleteStudent);

router.post("/:id/reset-password", protect, authorize("admin"), resetStudentPassword);

module.exports = router;
