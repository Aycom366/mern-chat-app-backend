const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const CustomError = require("../errors");
const {
  createTokenUser,
  sendResetPassword,
  sendVerificationEmail,
  frontendEndpoint,
} = require("../utils");
const crypto = require("crypto");
const Token = require("../models/Token");
const { attachCookiesToBrowser } = require("../utils/jwt");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const GoogleLogin = async (req, res) => {
  const { tokenId } = req.body;

  //get the users data from the google clients
  try {
    const { payload } = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email_verified, email, given_name, picture } = payload;

    if (!email_verified) {
      throw new CustomError.BadRequestError("Please verify your email");
    }

    //if user tries to login with google, then check if the user is already registered
    const user = await User.findOne({ email });
    let refreshToken = "";
    if (user) {
      //if user is registered, then check if the user has a refresh token
      const existingRefreshToken = await Token.findOne({ user: user._id });
      const token = createTokenUser(user);
      if (existingRefreshToken) {
        //if refresh token as exists
        refreshToken = existingRefreshToken;

        attachCookiesToBrowser({ res, user: token, refreshToken });
        res.status(200).json({ msg: "Login Successful", data: token });
        return;
      }

      //if refresh token is not present before, then re-create it
      refreshToken = crypto.randomBytes(40).toString("hex");
      const userAgent = req.headers["user-agent"];
      const ip = req.ip;

      await Token.create({ refreshToken, ip, userAgent, user: user._id });

      attachCookiesToBrowser({ res, user: token, refreshToken });
      res.status(StatusCodes.OK).json({ msg: "Login Successful", data: token });
      return;
    }

    //if hasn't been created, then create the user
    //create a fakePassword
    let password = email + process.env.GMAIL_USER;
    const newUser = await User.create({
      name: given_name,
      email,
      password,
      isVerified: true,
      isGoogle: true,
      verified: new Date(Date.now()),
      pic: picture,
    });

    //create a token
    const token = createTokenUser(newUser);

    //create refresh token
    refreshToken = crypto.randomBytes(40).toString("hex");
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;

    await Token.create({ refreshToken, ip, userAgent, user: newUser._id });

    attachCookiesToBrowser({ res, user: token, refreshToken });

    res.status(StatusCodes.OK).json({ msg: "Login Successful", data: token });
  } catch (error) {
    res.status(500);
    throw new Error(error);
  }
};

const Login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Missing fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.Unauthenticated("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new CustomError.Unauthenticated("Invalid credentials");
  }

  if (!user.isVerified) {
    throw new CustomError.Unauthenticated("Please verify your email");
  }

  const token = createTokenUser(user);

  let refreshToken = "";

  //find if current user has refreshTokenStored already
  const existingToken = await Token.findOne({ user: token.userId });

  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new CustomError.Unauthenticated("Account is locked");
    }
    refreshToken = existingToken.refreshToken;

    attachCookiesToBrowser({ res, user: token, refreshToken });

    res.status(StatusCodes.OK).json({ msg: "Logged in", data: token });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;

  //now thins to save
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);

  attachCookiesToBrowser({ res, user: token, refreshToken });

  res.status(StatusCodes.OK).json({ data: token });
};

const Register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new CustomError.BadRequestError("Missing fields");
  }

  let isEmailExist = await User.findOne({ email });
  if (isEmailExist) {
    throw new CustomError.BadRequestError("User already exists");
  }

  //setting up infos to send to email
  const verificationToken = crypto.randomBytes(40).toString("hex");

  const origin = frontendEndpoint;

  const user = await User.create({
    name,
    email,
    password,
    isGoogle: false,
    verificationToken,
    pic: req.pic
      ? req.pic
      : ' "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"',
  });

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: "success, Please check your email to verify your account" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError.BadRequestError("Please provide valid email");
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordtoken = crypto.randomBytes(70).toString("hex");

    const origin = frontendEndpoint;

    await sendResetPassword({
      name: user.name,
      email: user.email,
      token: passwordtoken,
      origin,
    });

    const tenMinutes = 1000 * 60 * 10;

    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = passwordtoken;
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;

    await user.save();
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Please check your email for reset password link" });
};

const resetPassword = async (req, res) => {
  const { email, password, passwordToken } = req.body;
  if (!email || !password || !passwordToken) {
    throw new CustomError.BadRequestError("Please Provide all values");
  }

  const user = await User.findOne({ email });
  if (user) {
    const currentDate = new Date();

    if (
      user.passwordTokenExpirationDate > currentDate &&
      passwordToken === user.passwordToken
    ) {
      user.password = password;
      user.passwordToken = "";
      user.passwordTokenExpirationDate = "";

      await user.save();
    }
  }
  res.status(StatusCodes.OK).json({ msg: "Password changed" });
};

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  //check to see if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.BadRequestError("User does not exist");
  }

  if (user.verificationToken !== verificationToken) {
    throw new CustomError.BadRequestError("Verification token is invalid");
  }

  user.isVerified = true;
  user.verificationToken = null;
  user.verified = Date.now();

  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Email verified" });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });
  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = {
  Login,
  Register,
  GoogleLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
};
