const express = require('express');
const storeController = require('../Controllers/storeController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');
const storeRouter = express.Router();

// Create a new store (manager only)
storeRouter.post('/create', protect, authorize('manager'), upload('stores').single('storeImg'), storeController.createStore);

// Add manager by store manager (store manager only)
storeRouter.put('/add-manager', protect, authorize('manager'), storeController.addManagerByStoreManager);

// Get all stores (authenticated users)
storeRouter.get('/', protect, storeController.getStores);

// Get store by ID (authenticated users)
storeRouter.get('/:id', protect, storeController.getStoreById);

// Update store by ID (manager only)
storeRouter.put('/:id', protect, authorize('manager'), storeController.updateStoreById);

// Delete store by ID (admin only)
storeRouter.delete('/:id', protect, authorize('admin'), storeController.deleteStoreById);

// Add vehicle to store's repaired vehicles (manager only)
storeRouter.put('/add-vehicle', protect, authorize('manager'), storeController.addVehicleToRepaired);

// Manager requests store deletion
storeRouter.put('/:id/request-deletion', protect, authorize('manager'), storeController.requestStoreDeletion);

// Get all deletion requests (admin only)
storeRouter.get('/deletion-requests', protect, authorize('admin'), storeController.getDeletionRequests);


module.exports = storeRouter;