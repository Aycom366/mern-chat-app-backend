const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authentication");
const handleAudio = require("../middlewares/handleAudio");
const {
  sendMessage,
  fetchMessage,
} = require("../controllers/messageController");

//sending message
router.route("/").post(authenticateUser, handleAudio, sendMessage);

//fetching single chat message
router.route("/:chatId").get(authenticateUser, fetchMessage);

module.exports = router;
