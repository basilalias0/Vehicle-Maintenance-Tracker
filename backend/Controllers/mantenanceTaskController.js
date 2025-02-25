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
        const {
            vehicleId,
            taskType,
            scheduledDate,
            scheduledMileage,
            completedDate,
            completedMileage,
            serviceProvider,
            partsReplaced,
            laborCost,
            notes,
            vendorId,
            storeId,
            priority,
            estimatedDuration,
            actualDuration,
            mileageUnits,
        } = req.body;

        // Input Validation
        if (!vehicleId || !taskType || !storeId) {
            return res.status(400).json({ message: 'Vehicle, task type, and store are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(storeId) || (vendorId && !mongoose.Types.ObjectId.isValid(vendorId))) {
            return res.status(400).json({ message: 'Invalid vehicle, store, or vendor ID' });
        }

        if (partsReplaced && (!Array.isArray(partsReplaced) || partsReplaced.some(part => !part.partId || !mongoose.Types.ObjectId.isValid(part.partId)))) {
            return res.status(400).json({ message: 'Invalid partsReplaced format' });
        }

        try {
            const maintenanceTask = await MaintenanceTask.create({
                vehicleId,
                taskType,
                scheduledDate,
                scheduledMileage,
                completedDate,
                completedMileage,
                serviceProvider,
                partsReplaced,
                laborCost,
                notes,
                vendorId,
                storeId,
                priority,
                estimatedDuration,
                actualDuration,
                mileageUnits,
            });

            // Update Vehicle maintenanceStores array only if store is not already present
            await Vehicle.findByIdAndUpdate(
                vehicleId,
                { $addToSet: { maintenanceStores: storeId } }, // Use $addToSet to prevent duplicates
                { new: true }
            );

            res.status(201).json(maintenanceTask);
        } catch (error) {
            console.error('Create Maintenance Task Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get all maintenance tasks (Enhanced with filtering and pagination)
    getAllMaintenanceTasks: asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, ...filters } = req.query;
        const skip = (page - 1) * limit;

        try {
            const tasks = await MaintenanceTask.find(filters)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('vehicleId')
                .populate('partsReplaced.partId')
                .populate('vendorId')
                .populate('storeId');

            const total = await MaintenanceTask.countDocuments(filters);

            res.json({
                tasks,
                page: parseInt(page),
                limit: parseInt(limit),
                total,
            });
        } catch (error) {
            console.error('Get All Maintenance Tasks Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    // Get maintenance task by ID
    getMaintenanceTaskById: asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid maintenance task ID' });
        }

        try {
            const task = await MaintenanceTask.findById(id)
                .populate('vehicleId')
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid maintenance task ID' });
        }

        if (updateData.vehicleId && !mongoose.Types.ObjectId.isValid(updateData.vehicleId)) {
            return res.status(400).json({ message: 'Invalid vehicle ID' });
        }

        if (updateData.vendorId && !mongoose.Types.ObjectId.isValid(updateData.vendorId)) {
            return res.status(400).json({ message: 'Invalid vendor ID' });
        }

        if (updateData.storeId && !mongoose.Types.ObjectId.isValid(updateData.storeId)) {
            return res.status(400).json({ message: 'Invalid store ID' });
        }

        if (updateData.partsReplaced && (!Array.isArray(updateData.partsReplaced) || updateData.partsReplaced.some(part => !part.partId || !mongoose.Types.ObjectId.isValid(part.partId)))) {
            return res.status(400).json({ message: 'Invalid partsReplaced format' });
        }

        try {
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