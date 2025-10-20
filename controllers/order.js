// controllers/order.js
const Order = require("../models/order");
const User = require("../models/auth");

// Create new order
async function createOrder(req, res) {
  try {
    const userId = req.user.userId;
    const { items, shipping, total, paymentInfo } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    const order = await Order.create({
      user: userId,
      items,
      shipping: shipping || {},
      total: Number(total) || 0,
      paymentInfo: paymentInfo || {},
      status: "Pending",
    });

    // Optional: clear cart
    const user = await User.findById(userId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    return res.json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

//  Get all orders of the logged-in user (with optional status filter)
async function getMyOrders(req, res) {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const query = { user: userId };
    if (status && status !== "All") query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    return res.json({ success: true, orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Get single order by ID
async function getOrderById(req, res) {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ success: true, order });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { createOrder, getMyOrders, getOrderById };
