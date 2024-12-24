const express = require("express");
require("dotenv").config();
const orderRedux = require("../orderModel");
const userRedux = require("../userModel");
const jsonKey = process.env.jsonkey;

const jwt = require("jsonwebtoken");
const router = express.Router();

function authorize(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token not provided" });
  else {
    jwt.verify(token, jsonKey, (err, decoded) => {
      if (err)
        return res.status(403).json({ message: "Token is invalid or expired" });
      req.decoded = decoded;
      next();
    });
  }
}
router.post("/orderplaced", authorize, async (req, res) => {
  const { cartItems, totalPrice } = req.body;

  if (!cartItems || totalPrice == 0 || !totalPrice)
    return res.status(400).json({ message: "No order has been placed" });
  const user = await userRedux.findOne({ email: req.decoded.email });

  if (!user)
    return res
      .status(403)
      .json({ message: "User is not found with the generated token" });
  try {
    const newOrder = new orderRedux({
      userId: user._id,
      username: user.username,
      orderItems: cartItems,
      price: totalPrice,
    });

    // clear the cart and totalPrice in userRedux table
    const userUpdate = await userRedux.findOneAndUpdate(
      { _id: user._id },
      { $set: { cart: [], totalAmount: 0 } },
      { new: true }
    );
    console.log("userUpdate", userUpdate);
    if (!userUpdate) {
      return res
        .status(400)
        .json({ message: "Failed to update userRedux table" });
    } else {
      await newOrder.save();
      return res.status(200).json({ message: "Order placed successfully" });
    }
  } catch (error) {
    console.error("Error while creating order", error);
    return res
      .status(500)
      .json({ message: "Server error occurred while placing order" });
  }
});
module.exports = router;
