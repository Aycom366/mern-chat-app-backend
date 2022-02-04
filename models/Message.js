//the id of the sender
//the content
//ref of the chat to which it belongs to

const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    content: { type: String },

    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readby: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", messageSchema);
