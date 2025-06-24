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
    socketId: {
      type: String,
      default: "",
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("users", userSchema);

export default User;
