// controllers/user.js
const User = require("../models/auth");
const Order = require("../models/order");

//  Get logged-in user's profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // support both payload styles
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user }); //  wrap in object for frontend
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//  Get logged-in user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ orders }); //  wrap in object for frontend
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
