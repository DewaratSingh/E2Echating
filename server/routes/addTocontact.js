import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

router.post("/addtocontact", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { contact } = req.body;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: "Number Required",
      });
    }



    const is = await User.findOne({ contact: contact });
    if (!is) {
      return res.status(400).json({
        success: false,
        message: "Contact not found",
      });
    }



    const user = await User.findByIdAndUpdate(decoded.id, {
      $addToSet: { friends: is._id },
    },{ new: true });

  let friends = [];

for (let i = 0; i < user.friends.length; i++) {
  const friendId = user.friends[i];
  const use = await User.findById(friendId);

  if (use) {
    friends.push({
      name: use.name,
      contact: use.contact,
      email: use.email,
      image: use.image,
      Id: use._id,
    });
  }
}

let data = {
  name: user.name,
  contact: user.contact,
  email: user.email,
  image: user.image,
  Id: user._id,
  friends: friends,
};

    return res.status(200).json({
      success: true,
      message: "Contact added sucessful",
      user:data,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
