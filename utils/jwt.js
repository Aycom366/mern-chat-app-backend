const jwt = require("jsonwebtoken");

//changing our users info into jwt token

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const isTokenValid = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

//attaching cookies to the browser
const attachCookiesToBrowser = ({ res, user, refreshToken }) => {
  const accessTokenJwt = createJWT({ payload: user });

  //refreshToken consists of the data save in Token Table, it would be used to refresh the access token

  const refreshTokenJwt = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const longerExp = oneDay * 30;

  res.cookie("accessToken", accessTokenJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });

  res.cookie("refreshToken", refreshTokenJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + longerExp),
  });
};

module.exports = { isTokenValid, attachCookiesToBrowser };
