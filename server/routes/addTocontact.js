import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Chat from "../models/chating.js";

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

    const chat = new Chat({});
    chat.save();

    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        $push: { friends: { friendId: is._id, roomId: chat._id, noifiy: 0 } },
      },
      { new: true }
    );

    const friend = await User.findByIdAndUpdate(
      is._id,
      {
        $push: { friends: { friendId: user._id, roomId: chat._id, noifiy: 0 } },
      },
      { new: true }
    );

    let friends = [];

    for (let i = 0; i < user.friends.length; i++) {
      const friendsArr = user.friends[i];
      const use = await User.findById(friendsArr.friendId);
      if (use) {
        friends.push({
          name: use.name,
          contact: use.contact,
          email: use.email,
          image: use.image,
          friendId: use._id,
          roomId: chat._id,
          online: use.online,
          noifiy: friendsArr.noifiy,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Contact added sucessful",
      contactList: friends,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/getMessage", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { roomId } = req.body;
    const chat = await Chat.findById(roomId);

    return res.status(200).json({
      success: true,
      mes: chat.chats,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/getContact", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    let friends = [];

    for (let i = 0; i < user.friends.length; i++) {
      const friendsArr = user.friends[i];
      const use = await User.findById(friendsArr.friendId);
      if (use) {
        friends.push({
          name: use.name,
          contact: use.contact,
          email: use.email,
          image: use.image,
          friendId: use._id,
          roomId: friendsArr.roomId,
          online: use.online,
          noifiy: friendsArr.noifiy,
        });
      }
      console.log(friendsArr.noifiy);
    }

    return res.status(200).json({
      success: true,
      message: "Contact added sucessful",
      contactList: friends,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/setNotify", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { friendId, notify } = req.body;

    const user = await User.findById(decoded.id);
    let friendslist = [];

    for (let i = 0; i < user.friends.length; i++) {
      const friendsArr = user.friends[i];
      if (friendsArr.friendId == friendId) {
          user.friends[i].noifiy = 0;
          await user.save();
        
      }
      const use = await User.findById(friendsArr.friendId);
      if (use) {
        friendslist.push({
          name: use.name,
          contact: use.contact,
          email: use.email,
          image: use.image,
          friendId: use._id,
          roomId: friendsArr.roomId,
          online: use.online,
          noifiy: user.friends[i].noifiy ,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Contact added sucessful",
      contactList: friendslist,
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
