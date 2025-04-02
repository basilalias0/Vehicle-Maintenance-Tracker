const express = require('express');
const adminController = require('../Controllers/adminController');
const { protect, admin } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');

const adminRouter = express.Router();

// Public Routes (No Authentication Needed)
adminRouter.post('/register', adminController.registerAdmin);
adminRouter.post('/login', adminController.loginAdmin);
adminRouter.post('/forgot-password', adminController.forgotPassword);
adminRouter.post('/reset-pin', adminController.resetPassword);

// Protected Routes (Authentication Required)
adminRouter.get('/profile', protect, adminController.getAdminProfile);
adminRouter.put('/profile', protect, adminController.updateAdminProfile);
adminRouter.put('/profile/picture', protect, upload('admins').single('profileImage'), adminController.updateAdminProfileImage);
adminRouter.delete('/:adminId', protect, adminController.deleteAdmin);

// Admin Routes (Authentication and Admin Role Required)
adminRouter.get('/users', protect, admin, adminController.getAllUsers);
adminRouter.get('/stores', protect, admin, adminController.getAllStores);
adminRouter.get('/vehicles', protect, admin, adminController.getAllVehicles);
adminRouter.get('/tasks', protect, admin, adminController.getAllMaintenanceTasks);
adminRouter.get('/parts', protect, admin, adminController.getAllParts);
adminRouter.get('/vendors', protect, admin, adminController.getAllVendors);
adminRouter.put('/admins/:adminId/verify', protect, admin, adminController.verifyAdmin);
adminRouter.put('/managers/:managerId/verify', protect, admin, adminController.verifyManager);

module.exports = adminRouter;