const express = require('express');
const managerRouter = express.Router();
const upload = require('../Middlewares/uploadMiddleware'); // Changed to dynamic upload
const managerController = require('../Controllers/managerController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Public Routes (No Authentication Needed)
managerRouter.post('/register', managerController.registerManager); // Updated controller function name
managerRouter.post('/login', managerController.loginManager); // Updated controller function name

// Protected Routes (Authentication Required)
managerRouter.get('/profile', protect, managerController.getManagerProfile); // Updated controller function name
managerRouter.put('/profile', protect, managerController.updateManagerProfile); // Updated controller function name
managerRouter.put('/profile/picture', protect, upload('managers').single('profileImage'), managerController.updateManagerProfileImage); // Updated controller function name, dynamic upload
managerRouter.post('/logout', protect, managerController.logoutManager); // Updated controller function name

// Admin Routes (Authentication and Admin Role Required)
managerRouter.get('/', protect, authorize('admin'), managerController.getManagers); // Updated controller function name
managerRouter.get('/:id', protect, authorize('admin'), managerController.getManagerById); // Updated controller function name
managerRouter.put('/:id', protect, authorize('admin'), managerController.updateManagerById); // Updated controller function name

module.exports = managerRouter;