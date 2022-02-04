const CustomError = require("../errors");
const { isTokenValid } = require("../utils");
const Token = require("../models/Token");
const { attachCookiesToBrowser } = require("../utils");

const authenticateUser = async (req, res, next) => {
  //checking if user is login and checking browser cookies to fetch info
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = {
        name: payload.name,
        email: payload.email,
        userId: payload.userId,
      };
      return next();
    }

    //if accessToken has expired
    const payload = isTokenValid(refreshToken);

    //fetch from database, filtering user and refreshToken to get infos encyprted
    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });

    //check if existingToken exists
    if (!existingToken || !existingToken?.isValid) {
      throw new CustomError.Unauthenticated("Authorization Invalid");
    }

    //swap accessToken and create a new refreshToken
    attachCookiesToBrowser({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    req.user = payload;
    next();
  } catch (error) {
    throw new CustomError.Unauthenticated("Authentication Invalid");
  }
};

module.exports = { authenticateUser };
