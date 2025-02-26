const express = require('express');
const ownerRouter = express.Router();
const upload = require('../Middlewares/imageUpload'); 
const ownerController = require('../Controllers/ownerController');
const { protect } = require('../Middlewares/authMiddleware');

// Public Routes (No Authentication Needed)
ownerRouter.post('/register', ownerController.registerOwner); // Updated controller function name
ownerRouter.post('/login', ownerController.loginOwner); // Updated controller function name

// Protected Routes (Authentication Required)
ownerRouter.get('/profile', protect, ownerController.getOwnerProfile); // Updated controller function name
ownerRouter.put('/profile', protect, ownerController.updateOwnerProfile); // Updated controller function name
ownerRouter.put('/profile/picture', protect, upload('owners').single('profileImage'), ownerController.updateOwnerProfileImage); // Updated controller function name, dynamic upload

module.exports = ownerRouter;