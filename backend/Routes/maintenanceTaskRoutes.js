const express = require('express');
const maintenanceTaskController = require('../Controllers/maintenanceTaskController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const maintenanceTaskRouter = express.Router();

// Create a new maintenance task (admin, owner, manager)
maintenanceTaskRouter.post('/', protect, authorize('admin', 'owner', 'manager'), maintenanceTaskController.createMaintenanceTask);

// Get all maintenance tasks (admin, manager) - with filtering and pagination
maintenanceTaskRouter.get('/', protect, authorize('admin', 'manager'), maintenanceTaskController.getAllMaintenanceTasks);

// Get maintenance task by ID (authenticated users)
maintenanceTaskRouter.get('/:id', protect, maintenanceTaskController.getMaintenanceTaskById);

// Update maintenance task by ID (admin, manager, owner of vehicle)
maintenanceTaskRouter.put('/:id', protect, authorize('admin', 'manager', 'owner'), maintenanceTaskController.updateMaintenanceTaskById);

// Delete maintenance task by ID (admin, manager)
maintenanceTaskRouter.delete('/:id', protect, authorize('admin', 'manager'), maintenanceTaskController.deleteMaintenanceTaskById);

// Get maintenance tasks by vehicle ID (authenticated users, owner of vehicle)
maintenanceTaskRouter.get('/vehicle/:vehicleId', protect, authorize('owner'), maintenanceTaskController.getMaintenanceTasksByVehicleId);

// Change maintenance task status (admin, manager)
maintenanceTaskRouter.put('/:taskId/status', protect, authorize('admin', 'manager'), maintenanceTaskController.changeMaintenanceTaskStatus);

// Get tasks by status and store ID (manager)
maintenanceTaskRouter.get('/status', protect, authorize('manager'), maintenanceTaskController.getTasksByStatus);

module.exports = maintenanceTaskRouter;