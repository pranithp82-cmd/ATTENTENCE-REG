const express = require("express");
const router = express.Router();
const { getAIInsights } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

router.get("/insights", protect, authorize("admin"), getAIInsights);

module.exports = router;
