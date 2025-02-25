const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const upload = (folder) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: folder, // Use the provided folder name
            allowedFormats: ['jpg', 'png', 'gif', 'jpeg'],
            resource_type: 'image',
        },
    });

    return multer({ storage });
};

module.exports = upload;