const User = require("../models/auth");

async function isAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { isAdmin };
