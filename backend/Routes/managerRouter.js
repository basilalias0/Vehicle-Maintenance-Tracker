const express = require('express');
const managerRouter = express.Router();
const managerController = require('../Controllers/managerController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload'); 

// Public Routes
managerRouter.post('/register', managerController.registerManager);
managerRouter.post('/login', managerController.loginManager);

// Protected Routes (Manager Role)
managerRouter.get('/profile', protect, authorize('manager'), managerController.getManagerProfile);
managerRouter.put('/profile', protect, authorize('manager'), managerController.updateManagerProfile);
managerRouter.put('/profile/picture', protect, authorize('manager'), upload('managers').single('profileImage'), managerController.updateManagerProfileImage);
managerRouter.post('/add-to-store', protect, authorize('manager'), managerController.addManagerToStore);// need to check after store controller completed
managerRouter.get('/my-store', protect, authorize('manager'), managerController.getManagersInMyStore);// need to check after store controller completed
managerRouter.get('/my-store/vehicles', protect, authorize('manager'), managerController.getManagerStoreVehicles);// need to check after vehicle controller completed
managerRouter.get('/my-store/tasks', protect, authorize('manager'), managerController.getManagerStoreMaintenanceTasks);// need to check after task controller completed
managerRouter.put('/tasks/status', protect, authorize('manager'), managerController.updateMaintenanceTaskStatus);// need to check after task controller completed
managerRouter.put('/vehicles/status', protect, authorize('manager'), managerController.updateVehicleStatus);// need to check after vehicle controller completed
managerRouter.get('/inventory', protect, authorize('manager'), managerController.getPartsInventory);// need to check after parts controller completed
managerRouter.post('/inventory', protect, authorize('manager'), managerController.addPartToInventory);// need to check after parts controller completed

// Protected Routes (Admin Role)
managerRouter.get('/', protect, authorize('admin'), managerController.getManagers);
managerRouter.get('/:id', protect, authorize('admin'), managerController.getManagerById);



module.exports = managerRouter;