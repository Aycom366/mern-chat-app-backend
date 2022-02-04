const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middlewares/authentication");

const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
} = require("../controllers/chatController");
const uploadImage = require("../middlewares/uploadImage");

//accessing or creating chat when chat page is loaded
router
  .route("/")
  .get(authenticateUser, fetchChats)
  .post(authenticateUser, accessChat);

//creation of a groupchat
router.route("/group").post(authenticateUser, uploadImage, createGroupChat);

//renaming of group
router.route("/rename").patch(authenticateUser, renameGroup);

//removesomeone or leave group
router.route("/groupRemove").patch(authenticateUser, removeFromGroup);

//add user to a group
router.route("/groupAdd").patch(authenticateUser, addToGroup);

module.exports = router;
