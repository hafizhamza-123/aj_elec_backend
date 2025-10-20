// routes/orders.js
const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const { createOrder, getMyOrders, getOrderById } = require("../controllers/order");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);

module.exports = router;
