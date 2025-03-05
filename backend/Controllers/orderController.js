const Order = require('../Models/orderModel');
const Parts = require('../Models/partsModel');
const Store = require('../Models/storeModel');
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const orderController = {
    createOrder: asyncHandler(async (req, res) => {
        const { vendorId, orderItems, paymentMethod, stripePaymentIntentId, transactionId } = req.body;
        const managerId = req.user._id;
        const storeId = req.user.storeId;

        try {
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ message: 'Store not found' });
            }

            let totalAmount = 0;
            for (const item of orderItems) {
                const part = await Parts.findById(item.partId);
                if (!part || part.vendorId.toString() !== vendorId) {
                    return res.status(400).json({ message: 'Invalid part or vendor' });
                }
                totalAmount += item.quantity * part.price;
            }

            const order = await Order.create({
                storeId,
                managerId,
                vendorId,
                orderItems,
                totalAmount,
                shippingAddress: store.address,
                paymentMethod,
                stripePaymentIntentId,
                transactionId,
            });

            res.status(201).json(order);
        } catch (error) {
            console.error('Create Order Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            } else if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid ID format' });
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

    updateOrderStatus: asyncHandler(async (req, res) => {
        const { orderId, orderStatus, paymentStatus } = req.body;

        try {
            const order = await Order.findByIdAndUpdate(orderId, { orderStatus, paymentStatus }, { new: true });
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json(order);
        } catch (error) {
            console.error('Update Order Status Error:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: error.message });
            } else if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid ID format' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    createPaymentIntentForOrder: asyncHandler(async (req, res) => {
        const { orderId } = req.body;

        try {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: order.totalAmount * 100,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    orderId: orderId,
                },
            });

            await Order.findByIdAndUpdate(orderId, { stripePaymentIntentId: paymentIntent.id });

            res.send({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            console.error('Create Payment Intent Error:', error);
            if (error.raw && error.raw.message) {
                return res.status(400).json({ message: `Stripe Error: ${error.raw.message}` });
            } else if (error.name === 'CastError') {
                return res.status(400).json({ message: 'Invalid ID format' });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }),

    stripeWebhook: asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Stripe Webhook Signature Error:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.created':
                    const paymentIntentCreated = event.data.object;
                    await Order.findOneAndUpdate({ stripePaymentIntentId: paymentIntentCreated.id }, { paymentStatus: 'pending' });
                    break;
                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                    await Order.findOneAndUpdate({ stripePaymentIntentId: paymentIntentSucceeded.id }, { paymentStatus: 'paid' });
                    break;
                case 'payment_intent.payment_failed':
                    const paymentIntentFailed = event.data.object;
                    await Order.findOneAndUpdate({ stripePaymentIntentId: paymentIntentFailed.id }, { paymentStatus: 'failed' });
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Stripe Webhook Processing Error:', error);
            res.status(500).json({ message: 'Internal server error during webhook processing' });
        }
    }),
};

module.exports = orderController;