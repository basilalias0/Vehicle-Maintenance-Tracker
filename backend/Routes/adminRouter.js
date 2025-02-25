const express = require('express');
const adminRouter = express.Router();
const upload = require('../Middlewares/uploadMiddleware'); // Changed to dynamic upload
const adminController = require('../Controllers/adminController');
const { protect, admin } = require('../Middlewares/authMiddleware');

// Public Routes (No Authentication Needed)
adminRouter.post('/register', adminController.registerAdmin); // Updated controller function name
adminRouter.post('/login', adminController.loginAdmin); // Updated controller function name

// Protected Routes (Authentication Required)
adminRouter.get('/profile', protect, adminController.getAdminProfile); // Updated controller function name
adminRouter.put('/profile', protect, adminController.updateAdminProfile); // Updated controller function name
adminRouter.put('/profile/picture', protect, upload('admins').single('profileImage'), adminController.updateAdminProfileImage); // Updated controller function name, dynamic upload
adminRouter.post('/logout', protect, adminController.logoutAdmin); // Updated controller function name

// Admin Routes (Authentication and Admin Role Required)
adminRouter.get('/', protect, admin, adminController.getAdmins); // Updated controller function name
adminRouter.get('/:id', protect, admin, adminController.getAdminById); // Updated controller function name
adminRouter.put('/:id', protect, admin, adminController.updateAdminById); // Updated controller function name

//Admin Manager verification
adminRouter.put('/managers/:managerId/verify', protect, admin, adminController.verifyManager);

module.exports = adminRouter;