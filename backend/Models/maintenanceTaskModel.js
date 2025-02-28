const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    taskType: { type: String, required: true },
    scheduledDate: { type: Date },
    scheduledMileage: { type: Number },
    completedDate: { type: Date },
    completedMileage: { type: Number },
    serviceProvider: { type: String },
    partsReplaced: [
        {
            partId: {type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true},
            quantity: { type: Number, min: 1, default: 1 },
            cost: { type: Number, min: 0 },
        },
    ],
    laborCost: { type: Number },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    stripePaymentIntentId: { type: String },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    taskStatus: { type: String, enum: ['scheduled', 'in progress', 'completed', 'canceled'], default: 'scheduled' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    estimatedDuration: { type: Number },
    actualDuration: { type: Number },
    mileage: {type: Number},
    mileageUnits: {type: String, enum: ['miles', 'kilometers'], default: 'miles'},
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true} // Added storeId
}, { timestamps: true });

const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

module.exports = MaintenanceTask;