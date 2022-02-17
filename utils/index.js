const createTokenUser = require("./createTokenUser");

const sendResetPassword = require("./sendResetPassword");
const sendVerificationEmail = require("./sendVerificationEmail");
const { isTokenValid, attachCookiesToBrowser } = require("./jwt");
const createHash = require("./createHash");

const frontendEndpoint = "https://aydotcom-chat.netlify.app";

module.exports = {
  createTokenUser,
  sendResetPassword,
  createHash,
  isTokenValid,
  attachCookiesToBrowser,
  sendVerificationEmail,
  frontendEndpoint,
};
