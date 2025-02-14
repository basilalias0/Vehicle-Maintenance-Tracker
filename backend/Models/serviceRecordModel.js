const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  mileage: {
    type: Number,
    required: true,
  },
  task: {
    type: String,
    required: true,
  },
  serviceProvider: {
    type: String,
  },
  partsReplaced: [
    {
      partName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        min: 1,
        default: 1,
      },
      cost: {
        type: Number,
        min: 0,
      },
    },
  ],
  notes: {
    type: String,
  },
},{
    timestamps: true,
});

const ServiceRecord = mongoose.model('ServiceRecord', serviceRecordSchema);

module.exports = ServiceRecord