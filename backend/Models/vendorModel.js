const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  address: { type: String },
  specialization: { type: String },
});
const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor