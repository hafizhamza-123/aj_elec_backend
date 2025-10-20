const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/auth");

// ====================== CREATE PRODUCT ======================
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ success: true, message: "Product created successfully", product });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== UPDATE PRODUCT ======================
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, message: "Product updated", product: updated });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== DELETE PRODUCT ======================
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== GET ALL PRODUCTS ======================
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== GET SINGLE PRODUCT ======================
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== GET ALL USERS (Only Members, Exclude Admins) ======================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }) // 👈 fetch only regular users
      .select("-password -refreshToken") // hide sensitive fields
      .sort({ createdAt: -1 }); // optional: show newest first

    res.json({ success: true, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ====================== GET ALL ORDERS ======================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== UPDATE ORDER STATUS ======================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ====================== REVENUE STATS (LAST 6 MONTHS) ======================
exports.getRevenueStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Group paid orders by month
    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalRevenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthRevenue = revenueData.find(r => r._id === monthIndex + 1);
      last6Months.push({
        name: months[monthIndex],
        revenue: monthRevenue ? monthRevenue.totalRevenue : 0,
      });
    }

    res.json({ success: true, data: last6Months });
  } catch (err) {
    console.error("getRevenueStats error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch revenue stats" });
  }
};
