const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = async () => {
  const c = require("./config/db");
  await c();
};

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/misc", require("./routes/miscRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "AI-Powered Student Attendance System API is running..." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
