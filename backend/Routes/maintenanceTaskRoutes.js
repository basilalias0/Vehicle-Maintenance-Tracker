const express = require('express');
const maintenanceTaskRouter = express.Router();
const { protect } = require('../Middlewares/isAuth');
const maintenanceTaskController = require('../Controllers/mantenanceTaskController');

// Create a new maintenance task
maintenanceTaskRouter.post('/', protect, maintenanceTaskController.createTask);

// Get all maintenance tasks (with optional filters and pagination)
maintenanceTaskRouter.get('/', protect, maintenanceTaskController.getTasks);

// Get a single maintenance task by ID
maintenanceTaskRouter.get('/:id', protect, maintenanceTaskController.getTaskById);

// Update a maintenance task by ID
maintenanceTaskRouter.put('/:id', protect, maintenanceTaskController.updateTask);

// Delete a maintenance task by ID
maintenanceTaskRouter.delete('/:id', protect, maintenanceTaskController.deleteTask);

// Get maintenance tasks by Vehicle ID
maintenanceTaskRouter.get('/vehicle/:vehicleId', protect, maintenanceTaskController.getTasksByVehicle);

module.exports = router;