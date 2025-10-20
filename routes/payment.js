// routes/payment.js
const express = require("express");
const Stripe = require("stripe");
const { authMiddleware } = require("../middlewares/auth");
const Order = require("../models/order");
const User = require("../models/auth");
require("dotenv").config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  console.log("User from token:", req.user);

  try {
    // Normalize user ID (so both user._id and user.userId work)
    const userId = req.user._id || req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not found in token" });
    }

    const { items, shipping } = req.body;
    if (!items?.length) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Convert items to Stripe line_items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Add fixed shipping cost
    const shipping_cost = 5;
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: shipping_cost * 100,
      },
      quantity: 1,
    });

    // Calculate total
    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      shipping_cost
    );

    // Create order in MongoDB
    const newOrder = await Order.create({
      user: userId, 
      items,
      shipping,
      total,
      status: "Pending",
      paymentStatus: "unpaid",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}&order_id=${newOrder._id}`,
      cancel_url: `http://localhost:5173/cancel`,
      shipping_address_collection: { allowed_countries: ["PK"] },
      customer_email: shipping?.email || undefined,
      metadata: { orderId: newOrder._id.toString() },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Verify Stripe Session and Update Order
router.post("/verify-session", authMiddleware, async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;
    if (!sessionId || !orderId) {
      return res
        .status(400)
        .json({ success: false, message: "Session ID and Order ID required" });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product", "customer_details"],
    });

    // Check payment status
    if (!session || session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }

    // Update order in DB
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "Paid",
        paymentStatus: "paid",
        paymentInfo: {
          id: session.id,
          payment_intent: session.payment_intent,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Clear user cart
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("verify-session error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

module.exports = router;
