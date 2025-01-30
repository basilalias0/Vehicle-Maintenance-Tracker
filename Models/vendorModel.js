const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number.'] ,
    required:true 
  },
  address: {
    type: String,
    required: true,
  },
  specialization: {
    type: String, 
    enum: ['Engine Repair', 'Tire Replacement', 'Bodywork', 'Electrical', 'Other'], 
    required: true
  },
  parts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'Part'
  }]
},{
    timestamps:true
});

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor