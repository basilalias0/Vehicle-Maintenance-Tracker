const express = require('express');
const complaintRouter = express.Router();
const complaintController = require('../Controllers/complaintControllers'); // Adjust path as needed
const { protect, authorize } = require('../Middlewares/authMiddleware'); // Adjust path as needed

// Owner Routes
complaintRouter.post('/', protect, authorize('owner'), complaintController.createComplaint);
complaintRouter.get('/', protect, authorize('owner'), complaintController.getOwnerComplaints);
complaintRouter.put('/', protect, authorize('owner'), complaintController.updateOwnerComplaint);
complaintRouter.delete('/', protect, authorize('owner'), complaintController.deleteOwnerComplaint);
complaintRouter.put('/escalate', protect, authorize('owner'), complaintController.escalateComplaint);
complaintRouter.get('/suggest-stores', protect, authorize('owner'), complaintController.suggestStores);
complaintRouter.get('/suggest-managers', protect, authorize('owner'), complaintController.suggestManagers);

// Admin Routes
complaintRouter.get('/admin', protect, authorize('admin'), complaintController.getAdminComplaints);
complaintRouter.put('/admin', protect, authorize('admin'), complaintController.updateAdminComplaint);
complaintRouter.delete('/admin', protect, authorize('admin'), complaintController.adminDeleteStoreOrManager);

// Company Routes
complaintRouter.get('/managers-with-escalated-complaints', protect, authorize('manager'), complaintController.getManagersWithEscalatedComplaints);

module.exports = complaintRouter;