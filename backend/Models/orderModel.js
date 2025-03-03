const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    orderDate: { type: Date, default: Date.now },
    orderStatus: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled', 'completed'], default: 'pending' },
    totalAmount: { type: Number, required: true },
    orderItems: [{
        partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parts', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
    }],
    shippingAddress: { type: String, required: true }, // Store's address
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String }, // e.g., "Stripe", "Cash", "Bank Transfer"
    stripePaymentIntentId: { type: String }, // If Stripe is used
    transactionId: {type: String},
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;