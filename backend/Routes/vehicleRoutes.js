const express = require('express');
const vehicleController = require('../Controllers/vehicleController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const vechicleRouter = express.Router();

// Create a new vehicle (admin or owner)
vechicleRouter.post("/create", protect, authorize('admin', 'owner'), vehicleController.createVehicle);

// Get all vehicles (admin only)
vechicleRouter.get("/get-vehicles", protect, authorize('admin'), vehicleController.getVehicles);

// Get a vehicle by ID (authenticated users)
vechicleRouter.get("/:id", protect, vehicleController.getVehicleById);

// Update a vehicle by ID (admin or owner)
vechicleRouter.put("/:id", protect, authorize('admin', 'owner'), vehicleController.updateVehicle);

// Delete a vehicle by ID (admin or owner)
vechicleRouter.delete('/:id', protect, authorize('admin', 'owner'), vehicleController.deleteVehicle);

// Get vehicles of the owner
vechicleRouter.get("/owner/vehicles", protect, authorize('owner'), vehicleController.getOwnerVehicles);

module.exports = vechicleRouter;