const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String },
  price: { type: Number },
  image: { type: String },
  quantity: { type: Number, default: 1 },
});

const authSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }, // ✅ added
    refreshToken: { type: String },
    verified: { type: Boolean, default: false },
    cart: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model("user", authSchema);
module.exports = User;
