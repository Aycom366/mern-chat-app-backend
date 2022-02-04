const Chat = require("../models/Chat");
const CustomError = require("../errors");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const accessChat = async (req, res) => {
  //creating one on one chat with a new user
  const { userId } = req.body;

  //if the new userId is not passed
  if (!userId) {
    throw new CustomError.BadRequestError("userid param not sent with request");
  }

  //find chats about the current user and logined user and isGroupChat is false
  let isChat = await Chat.find({
    isGroupChat: false,
    //this is an array of users and we checking for userIds if they match
    $and: [
      { users: { $elemMatch: { $eq: req.user.userId } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    //if chat doesnt exist
    const chartData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user.userId, userId],
    };

    try {
      const createdChat = await Chat.create(chartData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );

      res.status(201).send(fullChat);
    } catch (error) {
      throw new Error(error.message);
    }
  }
};

const fetchChats = async (req, res) => {
  //fetch all chats related with the loginined user
  let chat = await Chat.find({ users: req.user.userId })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  chat = await User.populate(chat, {
    path: "lastestMessage.sender",
    select: "name pic email",
  });

  if (!chat) {
    throw new CustomError.NotFoundError("chats not found for this user");
  }
  res.status(StatusCodes.OK).send(chat);
};

const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    throw new CustomError.BadRequestError("Please fill all fields");
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    throw new CustomError.BadRequestError(
      "More than 2 users are required to form a group chat"
    );
  }

  users.push(req.user.userId);

  const groupChat = await Chat.create({
    chatName: req.body.name,
    users: users,
    isGroupChat: true,
    pic: req.pic,
    groupAdmin: req.user.userId,
  });

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(fullGroupChat);
};

const renameGroup = async (req, res) => {
  if (!req.body.chatId || !req.body.chatName) {
    throw new CustomError.BadRequestError("chatId and chatName is reuired");
  }
  const { chatId, chatName } = req.body;
  const updatedChat = await Chat.findOneAndUpdate(
    { _id: chatId },
    { chatName },
    { new: true, runValidators: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    throw new CustomError.NotFoundError("Chat Not found");
  } else {
    res.status(StatusCodes.OK).json(updatedChat);
  }
};

const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  if (!userId) {
    throw new CustomError.BadRequestError("userId is required");
  }

  const removeUser = await Chat.findByIdAndUpdate(
    { _id: chatId },
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removeUser) {
    throw new CustomError.NotFoundError("Chat Not found");
  } else {
    res.status(StatusCodes.OK).json(removeUser);
  }
};

const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  const added = await Chat.findByIdAndUpdate(
    { _id: chatId },
    { $push: { users: userId } },
    { new: true, runValidators: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    throw new CustomError.NotFoundError("User Doesnt exist");
  } else {
    res.status(StatusCodes.OK).json(added);
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
};
