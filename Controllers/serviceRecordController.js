
const asyncHandler = require('express-async-handler');
const ServiceRecord = require('../Models/serviceRecordModel');

const serviceRecordController = {
  createServiceRecord: asyncHandler(async (req, res) => {
    const { vehicle, date, mileage, task, serviceProvider, partsReplaced, notes } = req.body;

    if(!vehicle, !date || !mileage || !task  ||!serviceProvider || !partsReplaced ){
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const createdServiceRecord = await ServiceRecord.create({
      vehicle,
      date,
      mileage,
      task,
      serviceProvider,
      partsReplaced,
      notes,
    });

    if(!createdServiceRecord){
        return res.status(400).json({ message: 'Failed to create service record' });
    }

    res.status(201).json(createdServiceRecord);
  }),


  getAllServiceRecords: asyncHandler(async (req, res) => {
    const serviceRecords = await ServiceRecord.find({ vehicle: req.params.vehicleId })
      .sort({ date: -1 }) // Sort by date in descending order
      .populate('vehicle');
      if(!serviceRecords){
        return res.status(404).json({ message: 'No service records found for this vehicle'
      })
    }

    res.status(200).json(serviceRecords);
  }),


  getServiceRecordById: asyncHandler(async (req, res) => {
    const serviceRecord = await ServiceRecord.findById(req.params.id).populate('vehicle');

    if (!serviceRecord) {
      res.status(404).json({ message: 'Service record not found' });
    } else {
      res.status(200).json(serviceRecord);
    }
  }),


  deleteServiceRecord: asyncHandler(async (req, res) => {
    const serviceRecord = await ServiceRecord.findByIdAndDelete(req.params.id);

    if (!serviceRecord) {
      res.status(404).json({ message: 'Service record not found' });
    }
    
    res.status(200).json({ id: req.params.id });
    
  }),
};

module.exports = serviceRecordController;