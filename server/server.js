import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import addtocontact from "./routes/addTocontact.js";
import User from "./models/user.js";
import Chat from "./models/chating.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
connectDB();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api/", authRoutes);
app.use("/api/", addtocontact);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Token missing"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.user.toString();

  onlineUsers.set(userId, socket.id);

  await User.findByIdAndUpdate(userId, { $set: { online: true } });

  const user = await User.findById(userId);

  for (const friend of user.friends) {
    const fid = friend.friendId.toString();
    const friendSocketId = onlineUsers.get(fid);

    if (friendSocketId) {
      io.to(friendSocketId).emit("onlineDost", {
        userId,
        text: "Your friend is now online",
      });
    }
  }

  socket.on("sendMessage", async (data) => {
    const receiverSocketId = onlineUsers.get(data.id?.toString());

    const friend = await User.findById(data.id);

    for (let i = 0; i < friend.friends.length; i++) {
      const friendsArr = friend.friends[i];
      if (friendsArr.friendId == data.from) {
        friend.friends[i].noifiy += 1;
        await friend.save();
        break;
      }
    }

    await Chat.findByIdAndUpdate(data.roomId, {
      $push: {
        chats: {
          message: data.message,
          time: data.time,
          seen: 1,
          from: data.from,
        },
      },
    });

    if (receiverSocketId) {
      const user = await User.findById(data.from);

      io.to(receiverSocketId).emit("receiveMessage", {
        roomId: data.roomId,
        message: data.message,
        time: data.time,
        seen: 1,
        from: data.from,
        name: user.name,
      });
    }
  });

  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------------------------------------------------------------------
  socket.on(
    "offer",
    async ({ offer, to, from, roomId, time, name, audioOrVideo }) => {
      const receiverSocketId = onlineUsers.get(to?.toString());
      await Chat.findByIdAndUpdate(roomId, {
        $push: {
          chats: {
            message: audioOrVideo
              ? "??Call??Request./vedio??"
              : "??Call??Request./audio??",
            time: time,
            seen: 1,
            from: from,
          },
        },
      });
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-offer", { offer, from, name,audioOrVideo });
        const user = await User.findById(from);

        io.to(receiverSocketId).emit("receiveMessage", {
          roomId: roomId,
          message: audioOrVideo
            ? "??Call??Request./vedio??"
            : "??Call??Request./audio??",
          time: time,
          seen: 1,
          from: from,
          name: user.name,
        });
      }
    }
  );

  socket.on("answer", ({ answer, to }) => {
    const receiverSocketId = onlineUsers.get(to?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    const receiverSocketId = onlineUsers.get(to?.toString());
    console.log("ICE candidate", candidate, to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const receiverSocketId = onlineUsers.get(to?.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended");
    }
  });

  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  socket.on("disconnect", async () => {
    onlineUsers.delete(userId);

    await User.findByIdAndUpdate(userId, { $set: { online: false } });

    const user = await User.findById(userId);
    for (const friend of user.friends) {
      const fid = friend.friendId.toString();
      const friendSocketId = onlineUsers.get(fid);

      if (friendSocketId) {
        io.to(friendSocketId).emit("onlineDost", {
          userId,
          text: "Your friend went offline",
        });
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
});
