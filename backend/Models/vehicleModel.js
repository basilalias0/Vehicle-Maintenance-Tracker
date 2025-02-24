const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  vin: { type: String, required: true },
  registrationNumber: { type: String },
  color: { type: String },
  mileage: { type: Number },
  fuelType: { type: String },
  insuranceDetails: { type: String },
  image: { type: String },
  group: { type: String },
});

const Vehicle = mongoose.model("Vehicle",vehicleSchema)
module.exports = Vehicle