const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partNumber: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
});
const Parts =  mongoose.model('Part', partSchema);
module.exports = Parts