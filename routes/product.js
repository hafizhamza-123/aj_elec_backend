const express = require("express");
const Product = require("../models/product");
const router = express.Router();

/* -------------------------------
   ✅ Get all products or by category query
-------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = { $regex: new RegExp(category, "i") }; // Case-insensitive
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* -------------------------------
   🔍 Search products by name, category, or brand
-------------------------------- */
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    res.json(results);
  } catch (error) {
    console.error("❌ Error searching products:", error);
    res.status(500).json({ message: "Failed to search products" });
  }
});

/* -------------------------------
   ⭐ Get top-selling products
-------------------------------- */
router.get("/top", async (req, res) => {
  try {
    const topProducts = await Product.find({ topSeller: true }).limit(10);
    res.json(topProducts);
  } catch (error) {
    console.error("❌ Error fetching top-selling products:", error);
    res.status(500).json({ message: "Failed to fetch top-selling products" });
  }
});

/* -------------------------------
   📂 Get products by category (REST style)
-------------------------------- */
router.get("/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const products = await Product.find({
      category: { $regex: new RegExp(categoryName, "i") }, // Case-insensitive
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    res.json(products);
  } catch (error) {
    console.error("❌ Error fetching products by category:", error);
    res.status(500).json({ message: "Failed to fetch category products" });
  }
});

/* -------------------------------
   🛍️ Get single product by ID
-------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

module.exports = router;
