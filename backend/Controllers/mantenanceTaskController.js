
const asyncHandler = require('express-async-handler');
const MaintenanceTask = require('../Models/mantenanceTaskModel');


const maintenanceTaskController = {
  createTask: asyncHandler(async (req, res) => {
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
      reminderSent,
      paymentStatus,
      stripePaymentIntentId,
      vendorId,
      taskStatus,
      priority,
      estimatedDuration,
      actualDuration,
    } = req.body;
  
    // Input Validation (Example: Check for required fields)
    if (!vehicleId || !taskType) {
      res.status(400);
      throw new Error('Vehicle ID and Task Type are required');
    }
  
    try {
      const task = await MaintenanceTask.create({
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
        reminderSent,
        paymentStatus,
        stripePaymentIntentId,
        vendorId,
        taskStatus,
        priority,
        estimatedDuration,
        actualDuration,
      });
  
      res.status(201).json(task);
    } catch (error) {
      console.error('Create Task Error:', error);
  
      // Mongoose Validation Error Handling
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val) => val.message);
        res.status(400);
        throw new Error(`Validation Error: ${messages.join(', ')}`);
      }
  
      // Duplicate Key Error Handling
      if (error.code === 11000) {
        res.status(409); // Conflict
        throw new Error('Duplicate key error');
      }
  
      res.status(500); // Internal Server Error
      throw new Error('Failed to create maintenance task');
    }
  }),

  getTaskById:asyncHandler(async (req, res) => {
    const taskId = req.params.id;
  
    // Validation: Check if taskId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400); // Bad Request
      return res.json({ message: 'Invalid Task ID format' });
    }
  
    try {
      const task = await MaintenanceTask.findById(taskId)
        .populate('vehicleId')
        .populate('vendorId');
  
      if (task) {
        res.json(task);
      } else {
        res.status(404); // Not Found
        return res.json({ message: 'Task not found' });
      }
    } catch (error) {
      console.error('Get Task by ID Error:', error);
  
      // Mongoose Cast Error Handling (invalid ObjectId)
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        res.status(400); // Bad Request
        return res.json({ message: 'Invalid Task ID format' });
      }
  
      // Database Connection Error Handling
      if (error.name === 'MongoServerError') {
        res.status(503); // Service Unavailable
        return res.json({ message: 'Database error' });
      }
  
      res.status(500); // Internal Server Error
      return res.json({ message: 'Internal server error', error: error.message });
    }
  }),


  updateTask: asyncHandler(async (req, res) => {
    const taskId = req.params.id;
  
    // Validation: Check if taskId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400); // Bad Request
      return res.json({ message: 'Invalid Task ID format' });
    }
  
    try {
      const task = await MaintenanceTask.findByIdAndUpdate(taskId, req.body, {
        new: true,
        runValidators: true,
      })
        .populate('vehicleId')
        .populate('vendorId');
  
      if (task) {
        res.json(task);
      } else {
        res.status(404); // Not Found
        return res.json({ message: 'Task not found' });
      }
    } catch (error) {
      console.error('Update Task Error:', error);
  
      // Mongoose Validation Error Handling
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val) => val.message);
        res.status(400); // Bad Request
        return res.json({ message: 'Validation Error: ' + messages.join(', ') });
      }
  
      // Mongoose Cast Error Handling (invalid ObjectId)
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        res.status(400); // Bad Request
        return res.json({ message: 'Invalid Task ID format' });
      }
  
      // Database Connection Error Handling
      if (error.name === 'MongoServerError') {
        res.status(503); // Service Unavailable
        return res.json({ message: 'Database error' });
      }
  
      res.status(500); // Internal Server Error
      return res.json({ message: 'Internal server error', error: error.message });
    }
  }),


  deleteTask: asyncHandler(async (req, res) => {
    const taskId = req.params.id;
  
    // Validation: Check if taskId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.status(400); // Bad Request
      return res.json({ message: 'Invalid Task ID format' });
    }
  
    try {
      const task = await MaintenanceTask.findByIdAndDelete(taskId);
  
      if (task) {
        res.json({ message: 'Task removed' });
      } else {
        res.status(404); // Not Found
        return res.json({ message: 'Task not found' });
      }
    } catch (error) {
      console.error('Delete Task Error:', error);
  
      // Mongoose Cast Error Handling (invalid ObjectId)
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        res.status(400); // Bad Request
        return res.json({ message: 'Invalid Task ID format' });
      }
  
      // Database Connection Error Handling
      if (error.name === 'MongoServerError') {
        res.status(503); // Service Unavailable
        return res.json({ message: 'Database error' });
      }
  
      res.status(500); // Internal Server Error
      return res.json({ message: 'Internal server error', error: error.message });
    }
  }),
    getTasks:asyncHandler(async (req, res) => {
      try {
        // Optional Filters (Example: filter by vehicleId or taskStatus)
        const filters = {};
        if (req.query.vehicleId) {
          filters.vehicleId = req.query.vehicleId;
        }
        if (req.query.taskStatus) {
          filters.taskStatus = req.query.taskStatus;
        }
    
        // Optional Pagination (Example: limit and skip)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
    
        // Fetch tasks
        const tasks = await MaintenanceTask.find(filters)
          .populate('vehicleId')
          .populate('vendorId')
          .skip(skip)
          .limit(limit);
    
        // Count total tasks (for pagination metadata)
        const totalTasks = await MaintenanceTask.countDocuments(filters);
    
        res.json({
          tasks,
          page,
          limit,
          totalTasks,
          totalPages: Math.ceil(totalTasks / limit),
        });
      } catch (error) {
        console.error('Get Tasks Error:', error);
    
    
        res.status(500); // Internal Server Error
        return res.json({ message: 'Internal server error', error: error.message });
      }
    }),
    getTasksByVehicle : asyncHandler(async (req, res) => {
      const vehicleId = req.params.vehicleId;
    
      // Validation: Check if vehicleId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        res.status(400); // Bad Request
        return res.json({ message: 'Invalid Vehicle ID format' });
      }
    
      try {
        const tasks = await MaintenanceTask.find({ vehicleId: vehicleId })
          .populate('vehicleId')
          .populate('vendorId');
    
        res.json(tasks);
      } catch (error) {
        console.error('Get Tasks by Vehicle ID Error:', error);
    
        // Mongoose Cast Error Handling (invalid ObjectId)
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
          res.status(400); // Bad Request
          return res.json({ message: 'Invalid Vehicle ID format' });
        }
    
        res.status(500); // Internal Server Error
        return res.json({ message: 'Internal server error', error: error.message });
      }
    })

};

module.exports = maintenanceTaskController;