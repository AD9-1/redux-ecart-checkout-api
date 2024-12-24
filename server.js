const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 7777;
const stripeRoutes = require("./routes/stripe");
const userRoutes=require("./routes/userRoutes");
const orderRoutes=require("./routes/orderRoutes");

app.use("/stripe", stripeRoutes);
app.use("/user",userRoutes);

app.use("/order",orderRoutes);

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
app.get("*", (req, res) => {
    res.status(404).json({ message: "Page not found" });
  });

app.get("/", (req, res) => {
  res.send("Hello from server!");
});
