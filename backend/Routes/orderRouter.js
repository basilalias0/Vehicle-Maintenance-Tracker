const express = require('express');
const orderRouter = express.Router();
const orderController = require('../Controllers/orderController');
const { protect, authorize } = require('../Middlewares/authMiddleware');
const bodyParser = require('body-parser');

// Create an order (manager only)
orderRouter.post('/', protect, authorize('manager'), orderController.createOrder);

// Get orders by store (manager only)
orderRouter.get('/', protect, authorize('manager'), orderController.getOrdersByStore);

// Update order status (admin or manager)
orderRouter.put('/status', protect, authorize('admin', 'manager'), orderController.updateOrderStatus);

// Create payment intent for an order (manager only)
orderRouter.post('/payment-intent', protect, authorize('manager'), orderController.createPaymentIntentForOrder);

// Stripe webhook (public, no authentication needed)
orderRouter.post('/webhook', bodyParser.raw({ type: 'application/json' }), orderController.stripeWebhook);



module.exports = orderRouter;