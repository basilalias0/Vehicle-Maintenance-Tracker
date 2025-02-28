const express = require('express');
const vehicleController = require('../Controllers/vehicleController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const vehicleRouter = express.Router();

// Create a new vehicle (manager)
vehicleRouter.post("/create", protect, authorize('manager'), vehicleController.createVehicle);

// Get all vehicles (admin)
vehicleRouter.get("/get-vehicles", protect, authorize('admin'), vehicleController.getVehicles);

// Get a vehicle by ID (authenticated users)
vehicleRouter.get("/:id", protect, vehicleController.getVehicleById);

// Update a vehicle by ID (manager)
vehicleRouter.put("/:id", protect, authorize('manager'), vehicleController.updateVehicle);

// Delete a vehicle by ID (manager)
vehicleRouter.delete('/:id', protect, authorize('manager'), vehicleController.deleteVehicle);

// Get vehicles of the owner
vehicleRouter.get("/owner/vehicles", protect, authorize('owner'), vehicleController.getOwnerVehicles);

// Get vehicles of a store (manager)
vehicleRouter.get("/store/vehicles", protect, authorize('manager'), vehicleController.getStoreVehicles);

module.exports = vehicleRouter;