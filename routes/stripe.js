const express = require("express");
require("dotenv").config();
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51OhJiKEbJSAocZFKu7B5x96YKyYNark2ueaEfJw73PSje0KJsOilCqzAyHDEO6ifPSibn8Zh4U5ViF9jhupW2xCW003yxq0pRv"
);
router.post("/", async function (req, res) {
  if (!req.body.products) {
    return res.status(400).json({ error: "No products provided" });
  }
  const { products } = req.body;

  try{
     const lineItems = products.map((product) => ({
    price_data: {
      currency: "cad",
      product_data: {
        name: product.title,
        images: [product.image],
      },
      unit_amount: Math.round(product.price * 100),
    
    },
    quantity: product.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:3000?payment=success",
    cancel_url: "http://localhost:3000/cancel",
  });
  res.json({ id: session.id });}
  catch(error)
  {
    console.error("Stripe error :",error);
    res.status(500).json({ error: "Server error" });
  }
 
});
module.exports = router;
