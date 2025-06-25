import mongoose from "mongoose";



const chatSchema = new mongoose.Schema(
  {
    chats:{type:Array ,default:[]}
  }
);

const Chat = mongoose.model("chats", chatSchema);
export default Chat;
