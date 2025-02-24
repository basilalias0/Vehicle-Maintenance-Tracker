const express = require('express');
const router = express.Router();
const upload = require('../Middlewares/imageUpload')

const userController = require('../Controllers/userController');
const { protect, admin } = require('../Middlewares/isAuth');

// Public Routes (No Authentication Needed)
router.post('/register', userController.register);
router.post('/login', userController.loginUser);

// Protected Routes (Authentication Required)
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);
router.put('/profile/picture', protect, upload.single('profileImage'), userController.updateProfileImage); // Profile picture upload
router.post('/logout', protect, userController.logoutUser);

// Admin Routes (Authentication and Admin Role Required)
router.get('/', protect, admin, userController.getUsers);
router.get('/:id', protect, admin, userController.getUserById);
router.put('/:id', protect, admin, userController.updateUserById);

module.exports = router;