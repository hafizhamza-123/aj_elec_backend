// routes/user.js
const express = require("express");
const router = express.Router();
const { getUserProfile, getUserOrders } = require("../controllers/user");
const { authMiddleware } = require("../middlewares/auth"); 

// Protected routes
router.get("/profile", authMiddleware, getUserProfile);
router.get("/my-orders", authMiddleware, getUserOrders);

module.exports = router;
