const multer = require('multer');

// Multer Memory Storage (for Cloudinary direct stream upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
