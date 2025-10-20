// controllers/cart.js
const User = require("../models/auth");

/**
 * GET /cart
 * returns current user's cart
 */
async function getCart(req, res) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("cart");
    return res.json({ items: user?.cart || [] });
  } catch (err) {
    console.error("getCart error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * POST /cart
 * body: { product: { id, name, price, image }, qty }
 * adds or increments item
 */
async function addToCart(req, res) {
  try {
    const userId = req.user.userId;
    const { product, qty = 1 } = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ error: "Invalid product payload" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const pid = String(product.id);
    const existing = user.cart.find((i) => String(i.productId) === pid);
    if (existing) {
      existing.quantity = existing.quantity + Number(qty);
    } else {
      user.cart.push({
        productId: pid,
        name: product.name,
        price: Number(product.price) || 0,
        image: product.image || "",
        quantity: Number(qty),
      });
    }

    await user.save();
    return res.json({ items: user.cart });
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * PUT /cart/:productId
 * body: { qty }
 */
async function updateCartItem(req, res) {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { qty } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const item = user.cart.find((i) => String(i.productId) === String(productId));
    if (!item) return res.status(404).json({ error: "Item not found in cart" });

    item.quantity = Math.max(1, Number(qty) || 1);
    await user.save();

    return res.json({ items: user.cart });
  } catch (err) {
    console.error("updateCartItem error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * DELETE /cart/:productId
 */
async function removeCartItem(req, res) {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = user.cart.filter((i) => String(i.productId) !== String(productId));
    await user.save();
    return res.json({ items: user.cart });
  } catch (err) {
    console.error("removeCartItem error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * DELETE /cart
 * clear entire cart
 */
async function clearCart(req, res) {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.cart = [];
    await user.save();
    return res.json({ items: [] });
  } catch (err) {
    console.error("clearCart error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
