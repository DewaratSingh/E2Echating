import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contact: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      trim: true,
      default:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400",
    },
    online: {
      type: Boolean,
      default: false,
    },
    socketId: { type: String, default: "" },
    friends: [
      {
        friendId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        noifiy: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);

export default User;
