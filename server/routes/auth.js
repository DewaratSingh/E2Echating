import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

router.post("/signUp", async (req, res) => {
  try {
    const { name, email, password, contact, image } = req.body;

    if (!name || !email || !password || !contact || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }

    const existingContact = await User.findOne({ contact });
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: "Contact number is already used",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      contact,
      image,
    });
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/signIn", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    let data = {
      name: user.name,
      contact: user.contact,
      email: user.email,
      image: user.image,
      Id: user._id,
    };

    res.json({ success: true, user: data });
  } catch (error) {
    console.error("SignIn Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/signOut", async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

router.get("/isvalidUser", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    const newtoken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", newtoken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

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
      id: use._id,
    });
  }
}

let data = {
  name: user.name,
  contact: user.contact,
  email: user.email,
  image: user.image,
  id: user._id,
  friends: friends,
};

    res.json({ success: true, user: data, token: newtoken });
  } catch (error) {
    console.error("isvalidUser Error:", error);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
});

export default router;
