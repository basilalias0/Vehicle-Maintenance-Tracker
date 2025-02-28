const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
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
    status: {type: String, enum: ['active', 'inactive'], default: 'active'},
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    maintenanceStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }] // Added maintenanceStores
},{timestamps:true});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;