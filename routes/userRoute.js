const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authentication");

const {
  showCurrentUser,
  updateUser,
  updateUserPassword,
  getUser,
  getSingleUser,
} = require("../controllers/userController");

router.route("/").get(authenticateUser, getUser);
router.route("/showCurrentUser").get(authenticateUser, showCurrentUser);

router.route("/updateUser").patch(authenticateUser, updateUser);
router.route("/updateUserPassword").patch(authenticateUser, updateUserPassword);
router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
