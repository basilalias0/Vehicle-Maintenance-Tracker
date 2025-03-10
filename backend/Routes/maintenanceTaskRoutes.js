const express = require('express');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const maintenanceTaskController = require('../Controllers/mantenanceTaskController');
const maintenanceTaskRouter = express.Router();

// Create a new maintenance task (manager)
maintenanceTaskRouter.post('/:vehicleId', protect, authorize('manager'), maintenanceTaskController.createMaintenanceTask);

// Get all maintenance tasks (admin)
maintenanceTaskRouter.get('/', protect, authorize('admin'), maintenanceTaskController.getAllMaintenanceTasks);

// Get tasks by status and store ID (manager)
maintenanceTaskRouter.get('/status', protect, authorize('manager'), maintenanceTaskController.getTasksByStatus);

// Get maintenance task by ID (authenticated users)
maintenanceTaskRouter.get('/:id', protect, maintenanceTaskController.getMaintenanceTaskById);

// Update maintenance task by ID (manager)
maintenanceTaskRouter.put('/:id', protect, authorize('manager'), maintenanceTaskController.updateMaintenanceTaskById);

// Delete maintenance task by ID (admin)
maintenanceTaskRouter.delete('/:id', protect, authorize('admin'), maintenanceTaskController.deleteMaintenanceTaskById);

// Get maintenance tasks by vehicle ID (owner)
maintenanceTaskRouter.get('/vehicle/:vehicleId', protect, authorize('owner'), maintenanceTaskController.getMaintenanceTasksByVehicleId);



maintenanceTaskRouter.post('/payment-intent', protect, authorize('owner'), maintenanceTaskController.createPaymentIntent);

maintenanceTaskRouter.post('/webhook', express.raw({ type: 'application/json' }), maintenanceTaskController.stripeWebhook);

maintenanceTaskRouter.get('/unpaid-payments', protect, authorize('owner', 'manager'), maintenanceTaskController.getUnpaidPayments);

maintenanceTaskRouter.get('/vehicles/status', protect, authorize('manager'), maintenanceTaskController.getVehiclesByStatus);

maintenanceTaskRouter.put('/:id/escalate-payment', protect, authorize('manager'), maintenanceTaskController.escalatePayment);


module.exports = maintenanceTaskRouter;