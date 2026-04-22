require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload buffer
const uploadImageFromBuffer = (buffer, folder = 'amazon-clone/avatars') => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

module.exports = {
  cloudinary,
  uploadImageFromBuffer
};
