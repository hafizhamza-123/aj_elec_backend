const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, required: false }, // Can later link to User ID
    comment: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    topSeller: { type: Boolean, default: false },

    // ✅ Primary image (from ImgBB)
    image: { type: String, required: true },

    // ✅ Additional images (array of URLs)
    images: {
      type: [String],
      default: [],
    },

    // ✅ Optional key-value specs (camera type, battery, etc.)
    specifications: {
      type: Object,
      default: {},
    },

    // ✅ Array of embedded reviews
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
