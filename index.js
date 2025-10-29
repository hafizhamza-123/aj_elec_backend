const express = require("express");
const cors = require("cors");
require("dotenv").config();

const PORT = 8001;
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5174",
    "https://aj-electronics-frontend.vercel.app/"
  ],
  credentials: true,
}));

//  Import Routes
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const userRoutes = require("./routes/user");
const cartRoute = require("./routes/cart");
const ordersRoute = require("./routes/order");
const productRoute = require("./routes/product");
const paymentRoute = require("./routes/payment");

// Import Mongo DB Connection
const { ConnectMongoDb } = require("./connect");

ConnectMongoDb(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));


// Body parser
app.use(express.json());

// Routes
app.use("/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/cart", cartRoute);     // => /cart
app.use("/orders", ordersRoute); // => /orders
app.use("/users", userRoutes);
app.use("/products", productRoute);
app.use("/payment", paymentRoute);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
