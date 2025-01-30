const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  frequency: {
    type: Object,
    required: true,
    enum: {
      values: ['mileage', 'time'],
      message: '{VALUE} is not supported',
    },
  },
  value: {
    type: Number,
    required: true,
    min: 1,
  },
  reminderDays: {
    type: Number,
    default: 7,
  },
  vehicles: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
    }],
},{
    timestamps: true
});

const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

module.exports = MaintenanceTask;