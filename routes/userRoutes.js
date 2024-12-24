const express = require("express");
const router = express.Router();
const userRedux = require("../userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const key = process.env.jsonkey;
router.post("/signup", async (req, res) => {
  let { email, username, password } = req.body;
  if (
    !email ||
    !username ||
    !password ||
    email == " " ||
    username == " " ||
    password == " "
  )
    return res.status(400).json({ message: "Input fields must be provided" });
  else if (/^[a-zA-Z]*$/.test(username)) {
    return res.status(400).json({
      message:
        "Username should be mixed with uppercase,lowercase,special character and number",
    });
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  } else {
    try {
      let check = await userRedux.findOne({ email: email });
      console.log(check);
      if (check) {
        return res.status(400).json({ message: "Email already exists" });
      } else {
        let salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        if (salt) {
          let newUser = new userRedux({
            email,
            username,
            password: hashPassword,
          });
          newUser
            .save()
            .then((result) => {
              res
                .status(201)
                .json({ message: "User created successfully", data: result });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                message: "Error occurred while saving user",
                data: err.message,
              });
            });
        } else {
          return res
            .status(500)
            .json({ message: "Error occurred while generating salt" });
        }
      }
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }
});
router.get("/signup", async (req, res) => {
  await userRedux
    .find({})
    .then((result) => {
      res
        .status(200)
        .json({ message: "User fetched successfully", data: result });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "difficult to fetch data", data: err.message });
    });
});
function authorize(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No Token Provided" });
  } else {
    jwt.verify(token, key, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.decoded = decoded; // Attach decoded data to request object
      next();
    });
  }
}
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Input fields must be provided" });
  } else {
    try {
      const user = await userRedux.findOne({ email: email });
      if (!user)
        //if email matches with database, the value of "user" is the object itself, otherwise null
        return res.status(404).json({ message: "Email id not found" });
      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ message: "Incorrect password" });
      const token = jwt.sign({ email: user.email }, key, { expiresIn: "1h" });
      res.json({
        message: `${user.username} logged in successfully`,
        token: token,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res
        .status(500)
        .json({ message: "Error occurred while login", data: err });
    }
  }
});
function authorize(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No Token Provided" });
  } else {
    jwt.verify(token, key, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      console.log("decoded", decoded);
      req.decoded = decoded; // Attach decoded data to request object
      next();
    });
  }
}
router.post("/gotoCart", authorize, async (req, res) => {
  let { cartItems } = req.body;

  if (!cartItems)
    return res.status(400).json({ message: "There is nothing in your Cart" });
  const cart = cartItems;
  console.log("req.decoded.email", req.decoded.email);

  try {
    const totalAmount = cartItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    let user = await userRedux
      .findOneAndUpdate(
        { email: req.decoded.email },
        {
          $set: { cart, totalAmount },
        },
        { new: true }
      )
      .populate("cart");
    return res.status(201).json({ data: user, success: true });
  } catch (err) {
    console.error("Error while updating cart:", err);
    return res
      .status(500)
      .json({ message: "Error occurred while updating cart", data: err });
  }
});

module.exports = router;
