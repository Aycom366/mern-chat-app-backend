const mongoose = require("mongoose");
const NotificationSchema = mongoose.Schema({
  chat: { type: mongoose.Schema.ObjectId, ref: "Chat" },
  content: { type: String },
  sender: { type: mongoose.Schema.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Notification", NotificationSchema);
