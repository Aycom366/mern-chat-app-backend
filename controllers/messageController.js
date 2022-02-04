const CustomError = require("../errors");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { StatusCode } = require("http-status-codes");

//sending message
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if ((!content && !req.files) || !chatId) {
    throw new CustomError.BadRequestError("content or chatId is missing");
  }

  const newMessage = {
    sender: req.user.userId,
    content: req.files ? req.content : content,
    chat: chatId,
  };

  let message = await Message.create(newMessage);

  try {
    //havent understand this yet
    message = await message.populate("sender", "name pic");

    message = await message.populate("chat");

    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    //updating latest mesage
    await Chat.findByIdAndUpdate(
      { _id: chatId },
      {
        latestMessage: message,
      }
    );
    res.status(200).json(message);
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR);
    throw new Error(error.message);
  }
};

const updateRead = async (req, res) => {};

//fetching  chat sindle messages
const fetchMessage = async (req, res) => {
  const { chatId } = req.params;
  if (!chatId) {
    throw new CustomError.BadRequestError("chatId is missing");
  }
  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.status(200).json(messages);
  } catch (error) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR);
    throw new Error(error.message);
  }
};

module.exports = { sendMessage, fetchMessage };
