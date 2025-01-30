
const asyncHandler = require('express-async-handler');
const MaintenanceTask = require('../Models/mantenanceTaskModel');


const maintenanceTaskController = {
  createTask: asyncHandler(async (req, res) => {
    const { name, description, frequency, value, reminderDays, vehicles } = req.body;

    if(!name || !description || !frequency || !value || !vehicles){
        res.status(400).send("Data incomplete")
    }

    // Create a new MaintenanceTask instance
    const taskCreate = await MaintenanceTask.create({
      name,
      description,
      frequency,
      value,
      reminderDays,
      vehicles,
    });
    
    if(!taskCreate){
        res.status(400).send("Error creating task")
    }

    res.status(201).json({message:"Task Created Successfully"});
  }),

  getAllTasks: asyncHandler(async (req, res) => {
    const tasksFound = await MaintenanceTask.find().populate('vehicles'); // Populate vehicles field
    if(!tasksFound){
        res.status(400).send("No tasks found")
        }

    res.status(200).json({
        tasks:tasksFound
    });
  }),

  getTaskById: asyncHandler(async (req, res) => {
    const task = await MaintenanceTask.findById(req.params.id).populate('vehicles');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
    
  }),


  updateTask: asyncHandler(async (req, res) => {
    const task = await MaintenanceTask.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
    } 
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description) updates.description = req.body.description;
    if (req.body.frequency) updates.frequency = req.body.frequency;
    if (req.body.value) updates.taskDate = req.body.value;
    if (req.body.reminderDays) updates.taskStatus = req.body.reminderDays;

    const taskUpdated =  await MaintenanceTask.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
      });
      if(!taskUpdated){
        res.status(400).json({ message: "Task doesn't updated" });
      }
      res.status(200).json(task);
    
  }),


  deleteTask: asyncHandler(async (req, res) => {
    const taskDeleted = await MaintenanceTask.findByIdAndDelete(req.params.id);

    if (!taskDeleted) {
      res.status(404).json({ message: 'Task not found' });
    }

      res.status(200).json({ id: req.params.id });
    })

};

module.exports = maintenanceTaskController;