const express = require('express');
const managerRouter = express.Router();
const managerController = require('../Controllers/managerController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload'); 

// Public Routes
managerRouter.post('/register', managerController.registerManager);
managerRouter.post('/login', managerController.loginManager);
managerRouter.post('/forgot-password', managerController.forgotPassword);
managerRouter.post('/reset-pin', managerController.resetPassword);

// Protected Routes (Manager Role)
managerRouter.get('/profile', protect, authorize('manager'), managerController.getManagerProfile);
managerRouter.put('/profile', protect, authorize('manager'), managerController.updateManagerProfile);
managerRouter.put('/profile/picture', protect, authorize('manager'), upload('managers').single('profileImage'), managerController.updateManagerProfileImage);
managerRouter.delete('/:managerId', protect, authorize('manager'), managerController.deleteManager)
managerRouter.post('/add-to-store', protect, authorize('manager'), managerController.addManagerToStore);
managerRouter.post('/my-store', protect, authorize('manager'), managerController.getMyStore);
managerRouter.get('/my-store/manager', protect, authorize('manager'), managerController.getManagersInMyStore);
managerRouter.get('/my-store/vehicles', protect, authorize('manager'), managerController.getManagerStoreVehicles);
managerRouter.get('/my-store/tasks', protect, authorize('manager'), managerController.getManagerStoreMaintenanceTasks);
managerRouter.put('/tasks/status', protect, authorize('manager'), managerController.updateMaintenanceTaskStatusAndVehicle);


// Protected Routes (Admin Role)
managerRouter.get('/', protect, authorize('admin'), managerController.getAllManagers);
managerRouter.get('/:id', protect, authorize('admin'), managerController.getManagerById);



module.exports = managerRouter;