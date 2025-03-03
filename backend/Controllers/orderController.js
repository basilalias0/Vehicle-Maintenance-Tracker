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

            // Calculate total amount
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
                shippingAddress: store.address, // Use store's address
                paymentMethod,
                stripePaymentIntentId,
                transactionId,
            });

            res.status(201).json(order);
        } catch (error) {
            console.error('Create Order Error:', error);
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
                amount: order.totalAmount * 100, // Amount in cents
                currency: 'usd', // Or your currency
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
            res.status(500).json({ message: 'Internal server error' });
        }
    }),
};

module.exports = orderController;