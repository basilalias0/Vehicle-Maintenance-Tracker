const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Remove leading/trailing whitespace
  },
  description: {
    type: String,
    trim: true,
  },
  partNumber: {
    type: String,
    required: true,
    unique: true, // Ensure part numbers are unique
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Price cannot be negative
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true, // Part must be associated with a vendor
  },
  imageUrl: { // Add image URL field (optional)
    type: String,
    trim: true,
  },
},{
    timestamps: true,
});

const Parts =  mongoose.model('Part', partSchema);
module.exports = Parts