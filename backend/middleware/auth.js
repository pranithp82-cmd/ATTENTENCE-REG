const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "futuristic_neon_secure_jwt_secret_key_2026");

      // Fetch user from DB based on role and attach to request object
      if (decoded.role === "admin") {
        req.user = await Admin.findById(decoded.id).select("-password");
      } else if (decoded.role === "student") {
        req.user = await Student.findById(decoded.id).select("-password");
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : "none"}) is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
