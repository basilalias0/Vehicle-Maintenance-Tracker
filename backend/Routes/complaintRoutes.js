const express = require('express');
const router = express.Router();
const complaintController = require('../Controllers/complaintController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

// Owner Routes
router.post('/', protect, authorize('owner'), complaintController.createComplaint);
router.get('/', protect, authorize('owner'), complaintController.getOwnerComplaints);
router.put('/', protect, authorize('owner'), complaintController.updateOwnerComplaint);
router.delete('/', protect, authorize('owner'), complaintController.deleteOwnerComplaint);
router.put('/escalate', protect, authorize('owner'), complaintController.escalateComplaint);
router.get('/suggest-stores', protect, authorize('owner'), complaintController.suggestStores);
router.get('/suggest-managers', protect, authorize('owner'), complaintController.suggestManagers);

// Admin Routes
router.get('/admin', protect, authorize('admin'), complaintController.getAdminComplaints);
router.put('/admin', protect, authorize('admin'), complaintController.updateAdminComplaint);
router.delete('/admin', protect, authorize('admin'), complaintController.adminDeleteStoreOrManager);

module.exports = router;