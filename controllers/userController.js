const CustomError = require("../errors");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ data: req.user });
};

const updateUser = async (req, res) => {
  res.send("update");
};

const updateUserPassword = async (req, res) => {
  res.send("update user password");
};

//searching for users based on either their name or email
const getUser = async (req, res) => {
  const { search } = req.query;
  const user = search
    ? await User.find({
        $or: [
          {
            name: { $regex: search, $options: "i" },
          },
          { email: { $regex: search, $options: "i" } },
        ],
      }).find({ _id: { $ne: req.user.userId } })
    : await User.find({});
  res.status(StatusCodes.OK).send(user);
};

const getSingleUser = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -isVerified -verificationToken -__v"
  );
  if (!user) {
    throw new CustomError.NotFoundError(
      `User not found with id : ${req.params.id}`
    );
  }
  res.status(200).send(user);
};

module.exports = {
  showCurrentUser,
  updateUser,
  getUser,
  updateUserPassword,
  getSingleUser,
};
