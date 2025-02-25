const express = require('express');
const partController = require('../Controllers/partController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const partRouter = express.Router();

// Create a new part (vendor only)
partRouter.post('/create', protect, authorize('vendor'), partController.createPart);

// Get all/filtered parts (authenticated users)
partRouter.get('/', protect, partController.getParts);

// Get part by ID (authenticated users)
partRouter.get('/:id', protect, partController.getPart);

// Update part by ID (vendor only, vendor owns the part)
partRouter.put('/:id', protect, authorize('vendor'), partController.updatePart);

// Delete part by ID (vendor only, vendor owns the part)
partRouter.delete('/:id', protect, authorize('vendor'), partController.deletePart);

module.exports = partRouter;