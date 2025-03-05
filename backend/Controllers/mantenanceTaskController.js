const MaintenanceTask = require('../Models/maintenanceTaskModel');
const Vehicle = require('../Models/vehicleModel');
const Vendor = require('../Models/vendorModel');
const Store = require('../Models/storeModel');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Parts = require('../Models/partsModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const maintenanceTaskController = {
    // Create a new maintenance task
    createMaintenanceTask: asyncHandler(async (req, res) => {
        const {taskType, scheduledDate, scheduledMileage, laborCost, notes, priority, estimatedDuration, mileageUnits } = req.body;
        const manager = req.user;
        const storeId = manager.storeId;
        const {vehicleId} = req.params
    
        // Input Validation
        if (!vehicleId || !taskType || !storeId) {
            return res.status(400).json({ message: 'Vehicle, task type, and store are required' });
        }
    
        if (!mongoose.Types.ObjectId.isValid(vehicleId) || !mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({ message: 'Invalid vehicle, store' });
        }
        
    
        try {
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                return res.status(400).json({ message: "Vehicle not found" });
            }
    
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ message: "Store not found." });
            }
            if (laborCost < 0) {
                return res.status(400).json({ message: 'Labor cost must be a positive number' });
            }
    
            const maintenanceTask = await MaintenanceTask.create({
                vehicleId,
                taskType,
                scheduledDate,
                scheduledMileage,
                laborCost,
                notes,
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
                    populate: { path: 'ownerId' } // Populate vehicle and user details
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
    getAllMaintenanceTasks: asyncHandler(async (req, res) => {
        try {
            const tasks = await MaintenanceTask.find({})
                .populate('vehicleId')
                .populate('partsReplaced.partId')
                .populate('vendorId')
                .populate('storeId');
            res.json(tasks);
        } catch (error) {
            console.error('Get All Maintenance Tasks Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    updateMaintenanceTaskById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { vendorId, partsReplaced, ...updateData } = req.body; // Extract vendorId and partsReplaced
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
                if (!updateData.completedMileage) {
                    return res.status(400).json({ message: "completed Mileage is required when task is completed." });
                }
    
                // Handle vendor information
                if (vendorId) {
                    updateData.vendorId = vendorId;
    
                    // Validate partsReplaced if vendorId is provided
                    if (partsReplaced && Array.isArray(partsReplaced)) {
                        updateData.partsReplaced = partsReplaced.map(part => ({
                            partId: part.partId,
                            vendorId: vendorId, // Add vendorId to each part
                            quantity: part.quantity,
                        }));
                    } else {
                        return res.status(400).json({ message: "partsReplaced is required when vendorId is provided for a completed task." });
                    }
                } else if (partsReplaced) {
                     return res.status(400).json({message: "vendorId is required when partsReplaced is provided for a completed task."})
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
    const { status } = req.query;
    const storeId = req.user.storeId;

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
}),
    
     createPaymentIntent: asyncHandler(async (req, res) => {
        const { taskId } = req.body;

        try {
            const task = await MaintenanceTask.findById(taskId);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

            if (task.paymentStatus !== 'pending') {
                return res.status(400).json({ message: 'Payment already processed for this task' });
            }

            const totalCost = task.laborCost; // Assuming laborCost is the payment amount

            if (totalCost <= 0) {
                return res.status(400).json({ message: 'Invalid payment amount' });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalCost * 100, // Amount in cents
                currency: 'usd',
                automatic_payment_methods: { enabled: true },
                metadata: { taskId: taskId },
            });

            await MaintenanceTask.findByIdAndUpdate(taskId, { stripePaymentIntentId: paymentIntent.id });

            res.send({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            console.error('Create Payment Intent Error:', error);
            if (error.raw && error.raw.message) {
                return res.status(400).json({ message: `Stripe Error: ${error.raw.message}` });
            } else if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid ID format' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    stripeWebhook: asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Stripe Webhook Signature Error:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            let taskId
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                     taskId = paymentIntentSucceeded.metadata.taskId;

                    await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'paid' });
                    break;
                case 'payment_intent.payment_failed':
                    const paymentIntentFailed = event.data.object;
                     taskId = paymentIntentFailed.metadata.taskId;

                    await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'failed' });
                    break;
                case 'payment_intent.refunded':
                    const paymentIntentRefunded = event.data.object;
                     taskId = paymentIntentRefunded.metadata.taskId;

                    await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'refunded' });
                    break;

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Stripe Webhook Processing Error:', error);
            res.status(500).json({ message: 'Internal server error during webhook processing' });
        }
    }),
    getUnpaidPayments: asyncHandler(async (req, res) => {
        const user = req.user;

        try {
            let query = { paymentStatus: 'pending' };

            if (user.role === 'owner') {
                query.vehicleId = { $in: await getVehicleIdsForOwner(user._id) }; // Get vehicleIds for the owner
            } else if (user.role === 'manager') {
                query.storeId = user.storeId;
            } else {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const unpaidTasks = await MaintenanceTask.find(query)
                .populate('vehicleId')
                .populate('vendorId')
                .populate('partsReplaced.partId')
                .populate('partsReplaced.vendorId');

            res.json(unpaidTasks);
        } catch (error) {
            console.error('Get Unpaid Payments Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

// Helper function to get vehicleIds for an owner
async function getVehicleIdsForOwner(ownerId) {
    const Vehicle = require('../Models/vehicleModel'); // Assuming you have a Vehicle model
    const vehicles = await Vehicle.find({ ownerId: ownerId }, '_id');
    return vehicles.map(vehicle => vehicle._id);
}

module.exports = maintenanceTaskController;