const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/isAdmin");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  getRevenueStats, // <-- new controller added
} = require("../controllers/admin");

const router = express.Router();

// Protected & Admin-only routes
router.use(authMiddleware, isAdmin);

// ===== Product Routes =====
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);

// ===== User Routes =====
router.get("/users", getAllUsers);

// ===== Order Routes =====
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// ===== Revenue Stats =====
router.get("/revenue-stats", getRevenueStats);

module.exports = router;
