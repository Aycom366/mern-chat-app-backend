const express = require("express");
const router = express.Router();
const uploadImage = require("../middlewares/uploadImage");
const { authenticateUser } = require("../middlewares/authentication");

const {
  Login,
  Register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  GoogleLogin,
} = require("../controllers/authController");

router.route("/register").post(uploadImage, Register);
router.route("/login").post(Login);
router.post("/google-login", GoogleLogin);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/verify-email").post(verifyEmail);
router.route("/logout").post(authenticateUser, logout);

module.exports = router;
