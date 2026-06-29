const express = require("express");
const router = express.Router();
const { adminLogin, studentLogin, changePassword, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/admin/login", adminLogin);
router.post("/student/login", studentLogin);
router.put("/change-password", protect, changePassword);
router.get("/me", protect, getMe);

module.exports = router;
