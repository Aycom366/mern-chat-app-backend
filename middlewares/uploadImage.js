const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const CustomError = require("../errors");
const path = require("path");

const uploadImage = async (req, res, next) => {
  if (req.files) {
    const pic = req.files.pic;

    if (!pic.mimetype.startsWith("image")) {
      throw new CustomError.BadRequestError("Please Upload Image");
    }

    try {
      const imagePath = path.join(
        __dirname,
        "../public/uploads/" + `${pic.name}`
      );
      await pic.mv(imagePath);
      const result = await cloudinary.uploader.upload(imagePath, {
        use_filename: true,
        folder: "chat-app",
      });
      fs.unlinkSync(imagePath);
      req.pic = result.secure_url;
      return next();
    } catch (error) {
      res.status(500);
      throw new Error(error);
    }
  }
  next();
};

module.exports = uploadImage;
