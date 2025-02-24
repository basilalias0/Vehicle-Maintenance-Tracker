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
      partName: { type: String, required: true },
      quantity: { type: Number, min: 1, default: 1 },
      cost: { type: Number, min: 0 },
    },
  ],
  laborCost: { type: Number },
  notes: { type: String },
  reminderSent: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripePaymentIntentId: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  taskStatus: { type: String, enum: ['scheduled', 'in progress', 'completed', 'canceled'], default: 'scheduled' }, // Added taskStatus
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }, // Optional: Added priority
  estimatedDuration: { type: Number }, // Optional: Added estimatedDuration
  actualDuration: { type: Number }, // Optional: Added actualDuration
}, { timestamps: true });

const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

module.exports = MaintenanceTask;