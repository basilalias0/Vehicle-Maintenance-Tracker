const express = require('express');
const storeController = require('../Controllers/storeController');
const { protect, authorize } = require('../Middlewares/authMiddleware'); // Import authorize middleware
const storeRouter = express.Router();

// Create a new store (admin only)
storeRouter.post('/create', protect, authorize('admin'), storeController.createStore);

// Get all stores (authenticated users)
storeRouter.get('/', protect, storeController.getStores);

// Get store by ID (authenticated users)
storeRouter.get('/:id', protect, storeController.getStoreById);

// Update store by ID (admin or store manager)
storeRouter.put('/:id', protect, authorize('admin', 'manager'), storeController.updateStoreById);

// Delete store by ID (admin only)
storeRouter.delete('/:id', protect, authorize('admin'), storeController.deleteStoreById);

// Add vehicle to store's repaired vehicles (admin or store manager)
storeRouter.put('/add-vehicle', protect, authorize('admin', 'manager'), storeController.addVehicleToRepaired);

// Add manager by store manager (store manager only)
storeRouter.put('/add-manager', protect, authorize('manager'), storeController.addManagerByStoreManager);

module.exports = storeRouter;