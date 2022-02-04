//chatName
//isGroupChat
//list of users
//ref to latest message
//groupAdmin

//our chatModel would have the above properties

const mongoose = require("mongoose");
const ChatSchema = new mongoose.Schema(
  {
    chatName: {
      type: String,
      trim: true,
    },

    pic: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },

    isGroupChat: { type: Boolean, default: false },

    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
