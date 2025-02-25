const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceTask' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String },
    stripePaymentIntentId: { type: String },
    paymentStatus: { type: String, enum: ['succeeded', 'failed', 'pending'], default: 'pending' },
    refundId: { type: String },
    transactionId: {type: String},
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store'},

},{timestamps:true});

const Payments = mongoose.model('Payments', paymentSchema);

module.exports = Payments;