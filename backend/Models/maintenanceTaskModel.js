const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    taskType: { type: String, required: true },
    scheduledDate: { type: Date },
    scheduledMileage: { type: Number },
    completedDate: { type: Date },
    completedMileage: { type: Number },
    serviceProvider: { type: String },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Vendor assigned to the task
    partsReplaced: [{
        partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }, // Vendor who provided the part
        quantity: { type: Number },
    }],
    paymentEscalated: { type: Boolean, default: false },
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