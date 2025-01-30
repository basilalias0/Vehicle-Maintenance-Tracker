const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  make: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  chassisNumber: {
    type: String,
    unique: true, 
  },
  engineNumber: {
    type: String,
    unique: true, 
  },
  registrationNumber: {
    type: String,
    unique: true,
    required: true,
  },
  color: {
    type: String,
  },
  mileage: {
    type: Number,
    default: 0,
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'], 
  },
  imageUrl: {
    type: String, 
  }, 
  
},{
    timestamps: true,
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

 module.exports = Vehicle