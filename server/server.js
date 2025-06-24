import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import addtocontact from "./routes/addTocontact.js"
import cors from "cors";
import connectDB from "./config/database.js";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

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

const onlineUsers = new Map();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});


io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user);

  onlineUsers.set(socket.user, socket.id);

  socket.on("sendMessage", (data) => {
    const receiverSocketId = onlineUsers.get(data.id);
    console.log("Sending to:", data.id, "Message:", data.message);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", {
        message: data.message,
        from: socket.user,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user);
    onlineUsers.delete(socket.user);
  });
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`);
});
