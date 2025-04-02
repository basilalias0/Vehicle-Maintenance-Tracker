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
        const { vendorId, partId, quantity } = req.body; // Adjusted for single item
        const managerId = req.user._id;
        const storeId = req.user.storeId;

        if(!vendorId || !partId || !quantity) {
            return res.status(400).json({ message: 'Missing required fields' });
            }

        try {
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            const part = await Parts.findById(partId);
            if (!part || part.vendorId.toString() !== vendorId) {
                return res.status(400).json({ message: `Invalid part or vendor for part ID: ${partId}` });
            }

            if (quantity <= 0) {
                return res.status(400).json({ message: `Invalid quantity for part ID: ${partId}` });
            }

            const totalAmount = quantity * part.price;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalAmount * 100,
                currency: 'usd',
                automatic_payment_methods: { enabled: true },
                metadata: { managerId: managerId.toString(), storeId: storeId.toString() },
            });

            const order = await Order.create({
                storeId,
                managerId,
                vendorId,
                orderItems: [{ partId, quantity, price: part.price }], // Single item
                totalAmount,
                shippingAddress: store.address,
                stripePaymentIntentId: paymentIntent.id,
                paymentStatus: PAYMENT_STATUS_PENDING,
                orderStatus: ORDER_STATUS_PENDING,
            });

            await Parts.findByIdAndUpdate(partId, { $inc: { stock: -quantity } });

            res.send({ clientSecret: paymentIntent.client_secret, orderId: order._id });
        } catch (error) {
            console.error('Create Payment Intent Error:', error);
            if (error.raw && error.raw.message) {
                return res.status(400).json({ message: `Stripe Error: ${error.raw.message}` });
            }
            res.status(500).json({ message: 'Internal server error' });
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

    stripeWebhook: asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
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
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Stripe Webhook Processing Error:', error, event);
            res.status(500).json({ message: 'Internal server error during webhook processing' });
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