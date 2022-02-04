const fs = require("fs");
const CustomError = require("../errors");
const path = require("path");

const handleAudio = async (req, res, next) => {
  if (req.files !== null) {
    const content = req?.files?.content;
    if (content.mimetype === "application/octet-stream") {
      try {
        let uploadLocation = path.join(
          __dirname,
          "../public/audios/" + `${content.name}`
        );
        await content.mv(uploadLocation);
        //write the blob data to a file
        fs.writeFileSync(
          uploadLocation,
          Buffer.from(new Uint8Array(content.data))
        );

        req.content = "/audios/" + content.name;
        next();
        return;
      } catch (error) {
        console.log(error);
        res.status(500);
        throw new Error("uploading audio", error.message);
      }
    }
    throw new CustomError.BadRequestError("Please Upload Audio");
  }
  next();
};

module.exports = handleAudio;
