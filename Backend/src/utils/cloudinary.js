import dotenv from "dotenv";
dotenv.config(); 

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const normalizedPath = localFilePath.split(path.sep).join(path.posix.sep);

    console.log("Uploading file from:", normalizedPath);
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });
    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    console.log(
      "File uploaded on cloudinary and deleted from local storage",
      response.url
    );
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    } // remove the locally saved temporary file as the upload operation got failed
    console.log("Error in uploading file on cloudinary", error.message);
    return null;
  }
};

export { uploadOnCloudinary };
