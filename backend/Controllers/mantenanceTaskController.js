const MaintenanceTask = require('../Models/maintenanceTaskModel');
const Vehicle = require('../Models/vehicleModel');
const Part = require('../Models/partModel');
const Vendor = require('../Models/vendorModel');
const Store = require('../Models/storeModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const maintenanceTaskController = {
    // Create a new maintenance task
    createMaintenanceTask: asyncHandler(async (req, res) => {
        const { vehicleId, taskType, scheduledDate, scheduledMileage, laborCost, notes, vendorId, priority, estimatedDuration, mileageUnits } = req.body;
        const manager = req.user;
        const storeId = manager.storeId;
    
        // Input Validation
        if (!vehicleId || !taskType || !storeId) {
            return res.status(400).json({ message: 'Vehicle, task type, and store are required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(storeId) || (vendorId && !mongoose.Types.ObjectId.isValid(vendorId))) {
            return res.status(400).json({ message: 'Invalid vehicle, store, or vendor ID' });
        }
    
        try {
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle || vehicle.storeId.toString() !== storeId.toString()) {
                return res.status(400).json({ message: "Vehicle not found or does not belong to your store." });
            }
    
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ message: "Store not found." });
            }
    
            const maintenanceTask = await MaintenanceTask.create({
                vehicleId,
                taskType,
                scheduledDate,
                scheduledMileage,
                laborCost,
                notes,
                vendorId,
                storeId,
                priority,
                estimatedDuration,
                mileageUnits,
                serviceProvider: store.name, // Set service provider to store name
                taskStatus: 'scheduled' //set the default status to scheduled.
            });
    
            // Update Vehicle maintenanceStores array only if store is not already present
            await Vehicle.findByIdAndUpdate(vehicleId, { $addToSet: { maintenanceStores: storeId } }, { new: true });
    
            // Placeholder for service record generation
            // You would create a new ServiceRecord document here
            // based on the maintenance task details.
    
            res.status(201).json(maintenanceTask);
        } catch (error) {
            console.error('Create Maintenance Task Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    getMaintenanceTaskById: asyncHandler(async (req, res) => {
        const { id } = req.params;
    
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid maintenance task ID' });
        }
    
        try {
            const task = await MaintenanceTask.findById(id)
                .populate({
                    path: 'vehicleId',
                    populate: { path: 'user' } // Populate vehicle and user details
                })
                .populate('partsReplaced.partId')
                .populate('vendorId')
                .populate('storeId');
    
            if (!task) {
                return res.status(404).json({ message: 'Maintenance task not found' });
            }
    
            res.json(task);
        } catch (error) {
            console.error('Get Maintenance Task by ID Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Update maintenance task by ID
    updateMaintenanceTaskById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const manager = req.user;
    const storeId = manager.storeId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid maintenance task ID' });
    }

    try {
        const task = await MaintenanceTask.findById(id);

        if (!task || task.storeId.toString() !== storeId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this task" });
        }

        if (updateData.taskStatus && updateData.taskStatus === 'completed') {
            updateData.completedDate = new Date();
            if(!updateData.completedMileage){
                return res.status(400).json({message: "completedMileage is required when task is completed."})
            }
        }

        const updatedTask = await MaintenanceTask.findByIdAndUpdate(id, updateData, { new: true })
            .populate('vehicleId')
            .populate('partsReplaced.partId')
            .populate('vendorId')
            .populate('storeId');

        if (!updatedTask) {
            return res.status(404).json({ message: 'Maintenance task not found' });
        }
        res.json(updatedTask);
    } catch (error) {
        console.error('Update Maintenance Task Error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}),

    // Delete maintenance task by ID
    deleteMaintenanceTaskById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid maintenance task ID' });
        }

        try {
            const deletedTask = await MaintenanceTask.findByIdAndDelete(id);

            if (!deletedTask) {
                return res.status(404).json({ message: 'Maintenance task not found' });
            }

            res.json({ message: 'Maintenance task deleted successfully' });
        } catch (error) {
            console.error('Delete Maintenance Task Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
    getMaintenanceTasksByVehicleId: asyncHandler(async (req, res) => {
      const { vehicleId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
          return res.status(400).json({ message: 'Invalid vehicle ID' });
      }

      try {
          const tasks = await MaintenanceTask.find({ vehicleId: vehicleId })
              .populate('partsReplaced.partId')
              .populate('vendorId')
              .populate('storeId');

          res.json(tasks);
      } catch (error) {
          console.error('Get Maintenance Tasks by Vehicle ID Error:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }),

  // Change maintenance task status
  changeMaintenanceTaskStatus: asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(taskId)) {
          return res.status(400).json({ message: 'Invalid task ID' });
      }

      if (!['scheduled', 'in progress', 'completed', 'canceled'].includes(status)) {
          return res.status(400).json({ message: 'Invalid task status' });
      }

      try {
          const updatedTask = await MaintenanceTask.findByIdAndUpdate(
              taskId,
              { taskStatus: status },
              { new: true }
          )
              .populate('partsReplaced.partId')
              .populate('vendorId')
              .populate('storeId');

          if (!updatedTask) {
              return res.status(404).json({ message: 'Maintenance task not found' });
          }

          res.json(updatedTask);
      } catch (error) {
          console.error('Change Maintenance Task Status Error:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }),
  getTasksByStatus: asyncHandler(async (req, res) => {
    const { status, storeId } = req.query;

    if (!['scheduled', 'in progress', 'completed', 'canceled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid task status' });
    }

    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ message: 'Invalid or missing store ID' });
    }

    try {
        const tasks = await MaintenanceTask.find({ taskStatus: status, storeId: storeId })
            .populate('partsReplaced.partId')
            .populate('vendorId')
            .populate('storeId');

        res.json(tasks);
    } catch (error) {
        console.error('Get Tasks by Status and Store ID Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})
};

module.exports = maintenanceTaskController;