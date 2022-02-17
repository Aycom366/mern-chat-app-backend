require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();

//db
const connectDb = require("./db/connectDb");

//third party libraries

const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

//routes
const authRoutes = require("./routes/authRoute");
const userRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const messageRoutes = require("./routes/messageRoute");

//middlewares
const notFound = require("./middlewares/notFound");
const errorHandlerMiddleware = require("./middlewares/error-handler");
const { frontendEndpoint } = require("./utils");

app.use(express.static("./public"));
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(fileUpload());
app.use(mongoSanitize());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

//create an empty array that will serve as our online users mainly to aid our notifications saving, I din later work on the notifications
let users = [];

const addNewUser = ({ userId, socketId }) => {
  if (!users.includes(userId)) {
    users.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId == userId);
};

const start = async () => {
  try {
    await connectDb(process.env.MONGO_URL);
    const server = app.listen(port, () =>
      console.log(`server started on port ${port}`)
    );

    //setting up socket.io
    const io = require("socket.io")(server, {
      //if user din do anything, it will goes off to save bandWidth
      pingTimeout: 60000,
      cors: {
        origin: frontendEndpoint,
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      //creating a socket for each user
      socket.on("setup", (userData) => {
        socket.join(userData.userId);
        socket.emit("connected");
      });

      socket.on("newUser", (userId) => {
        addNewUser({ userId, socketId: socket.id });
      });

      socket.on("disconnect", () => removeUser(socket.id));

      //joining chats, creating chat room
      socket.on("join chat", (room) => {
        socket.join(room);
        console.log("user join room" + room);
      });

      socket.on("typing", (room) => socket.in(room).emit("typing"));

      socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

      socket.on("voiceRecord", (room) => socket.in(room).emit("voiceRecord"));

      socket.on("stopVoiceRecord", (room) =>
        socket.in(room).emit("stopVoiceRecord")
      );

      socket.on("new message", (newMessage) => {
        let chat = newMessage.chat;

        //if the chat doesnt has a user
        if (!chat.users) return console.log("chat.users not defined");

        //sending messages back to only users in a chat
        chat.users.forEach((user) => {
          //the sender shouldnt get message back
          if (user._id == newMessage.sender._id) return;

          //confirm if user is online to check whehter am going to use the saved user on the client or the Id that willl be passed here in case a user is offchat
          const checkUser = getUser(user._id);

          //this wee send the message to other available users
          socket.in(user._id).emit("message received", {
            ...newMessage,
            checkUser,
            userId: user._id,
          });
        });
      });

      //disconnecting the websocket
      socket.off("setup", () => {
        console.log("user disconnected");
        socket.leave(userData.userId);
      });

      /**************Video section*****************/

      //emit simple means, the frontend will be one triggering this method

      //this is the user triggering the video call passing iD THAT WILL be used from the frontend, meaning joining the room
      socket.emit("me", socket.id);

      socket.on("disconnect", () => {
        socket.broadcast.emit("callended");
      });

      //this method willl be called on the frontside supplying the id of the user that will be called
      socket.on("calluser", ({ userToCall, signalData, from, name }) => {
        //immediately sending back the data host create to the user that is calling
        io.to(userToCall).emit("calluser", { signal: signalData, from, name });
      });

      socket.on("answercall", (data) => {
        io.to(data.to).emit("callaccepted", data.signal);
      });

      console.log("connected to socket.io");
    });
  } catch (err) {
    console.error(err);
  }
};

start();
