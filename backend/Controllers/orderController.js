const Order = require('../Models/orderModel');
const Parts = require('../Models/partsModel');
const Store = require('../Models/storeModel');
const asyncHandler = require('express-async-handler');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Constants for order and payment statuses
const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_PROCESSING = 'processing';
const ORDER_STATUS_SHIPPED = 'shipped';
const ORDER_STATUS_DELIVERED = 'delivered';
const PAYMENT_STATUS_PENDING = 'pending';
const PAYMENT_STATUS_PAID = 'paid';
const PAYMENT_STATUS_FAILED = 'failed';

const orderController = {
    createPaymentIntentForOrder: asyncHandler(async (req, res) => {
        const { vendorId, partId, quantity, stripeToken } = req.body; // Add stripeToken
        const managerId = req.user._id;
        const storeId = req.user.storeId;

        console.log('createPaymentIntentForOrder called with:', { vendorId, partId, quantity, managerId, storeId, stripeToken });

        if (!vendorId || !partId || !quantity || !stripeToken) { // Add stripeToken check
            console.error('Missing required fields');
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const store = await Store.findById(storeId);
            if (!store) {
                console.error('Store not found');
                return res.status(404).json({ message: 'Store not found' });
            }

            const part = await Parts.findById(partId);
            if (!part || part.vendorId.toString() !== vendorId) {
                console.error('Invalid part or vendor for part ID:', partId);
                return res.status(400).json({ message: `Invalid part or vendor for part ID: ${partId}` });
            }

            if (quantity <= 0) {
                console.error('Invalid quantity for part ID:', partId);
                return res.status(400).json({ message: `Invalid quantity for part ID: ${partId}` });
            }

            const totalAmount = quantity * part.price;

            // Create a Stripe charge using the token
            const charge = await stripe.charges.create({
                amount: totalAmount * 100, // Amount in cents
                currency: 'usd',
                description: `Order for part ${part.partNumber}`,
                source: stripeToken, // Token from Stripe.js
                metadata: { managerId: managerId.toString(), storeId: storeId.toString() },
            });

            console.log('Stripe charge created:', charge);

            if (charge.status === 'succeeded') {
                const order = await Order.create({
                    storeId,
                    managerId,
                    vendorId,
                    orderItems: {
                        partId: partId,
                        quantity: quantity,
                        price: part.price,
                    },
                    totalAmount,
                    shippingAddress: store.address,
                    stripePaymentIntentId: charge.id, // Use charge ID
                    paymentStatus: PAYMENT_STATUS_PAID, // Mark as paid
                    orderStatus: ORDER_STATUS_PROCESSING, // Start processing
                });

                console.log('Order created:', order);

                res.status(201).json({ message: 'Order created and payment successful', orderId: order._id }); // Send order ID
            } else {
                res.status(400).json({ message: 'Payment failed' });
            }

        } catch (error) {
            console.error('Create Order/Payment Error:', error);
            if (error.raw && error.raw.message) {
                return res.status(400).json({ message: `Stripe Error: ${error.raw.message}` });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    stripeWebhook: asyncHandler(async (req, res) => {
        // ... (Your webhook code remains the same as it's not directly related to charges)
        const sig = req.headers['stripe-signature'];
        console.log("sig", sig);

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ORDER_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Stripe Webhook Signature Error:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                    await Order.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntentSucceeded.id },
                        { paymentStatus: PAYMENT_STATUS_PAID, orderStatus: ORDER_STATUS_PROCESSING }
                    );
                    break;
                case 'payment_intent.payment_failed':
                    const paymentIntentFailed = event.data.object;
                    await Order.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntentFailed.id },
                        { paymentStatus: PAYMENT_STATUS_FAILED }
                    );
                    break;
                case 'payment_intent.canceled':
                    const paymentIntentCanceled = event.data.object;
                    await Order.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntentCanceled.id },
                        { orderStatus: ORDER_STATUS_CANCELED }
                    );
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Stripe Webhook Processing Error:', error, event);
            res.status(500).json({ message: 'Internal server error during webhook processing' });
        }
    }),

    getOrdersByStore: asyncHandler(async (req, res) => {
        const storeId = req.user.storeId;

        try {
            const orders = await Order.find({ storeId }).populate('vendorId').populate('orderItems.partId');
            res.json(orders);
        } catch (error) {
            console.error('Get Orders By Store Error:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid ID format' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    deleteOrder: asyncHandler(async (req, res) => {
        const { orderId } = req.params;
        const storeId = req.user.storeId;

        try {
            const order = await Order.findOneAndDelete({ _id: orderId, storeId: storeId });
            if (!order) {
                return res.status(404).json({ message: 'Order not found or unauthorized' });
            }
            console.log(`Order ${orderId} deleted from store ${storeId}`);
            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error('Delete Order Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = orderController;