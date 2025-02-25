const express = require('express');
const vendorController = require('../Controllers/vendorController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const vendorRouter = express.Router();

// Get all vendors (admin only)
vendorRouter.get('/', protect, authorize('admin'), vendorController.getVendors);

// Create a new vendor (admin or self-registration)
vendorRouter.post('/create', vendorController.createVendor); // Removed protect, authorize for self-registration

// Delete a vendor by ID (admin only)
vendorRouter.delete('/:id', protect, authorize('admin'), vendorController.deleteVendor);

// Get a vendor by ID (authenticated users)
vendorRouter.get('/:id', protect, vendorController.getVendorById);

// Update a vendor by ID (vendor self-update, admin)
vendorRouter.put('/:id', protect, authorize('admin', 'vendor'), vendorController.updateVendor);

// Route for admin verification of vendor (admin only)
vendorRouter.put('/:id/verify', protect, authorize('admin'), vendorController.verifyVendor);

module.exports = vendorRouter;