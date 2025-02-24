const express = require('express');
const userRouter = express.Router();
const upload = require('../Middlewares/imageUpload')

const userController = require('../Controllers/userController');
const { protect, admin } = require('../Middlewares/isAuth');

// Public Routes (No Authentication Needed)
userRouter.post('/register', userController.register);
userRouter.post('/login', userController.loginUser);

// Protected Routes (Authentication Required)
userRouter.get('/profile', protect, userController.getUserProfile);
userRouter.put('/profile', protect, userController.updateUserProfile);
userRouter.put('/profile/picture', protect, upload.single('profileImage'), userController.updateProfileImage); // Profile picture upload
userRouter.post('/logout', protect, userController.logoutUser);

// Admin Routes (Authentication and Admin Role Required)
userRouter.get('/', protect, admin, userController.getUsers);
userRouter.get('/:id', protect, admin, userController.getUserById);
userRouter.put('/:id', protect, admin, userController.updateUserById);

module.exports = userRouter;