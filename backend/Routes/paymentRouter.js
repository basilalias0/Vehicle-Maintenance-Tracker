const express = require('express');
const app = express()
const { protect, authorize } = require('../Middlewares/authMiddleware');
const maintenanceTaskController = require('../Controllers/mantenanceTaskController');
const orderController = require('../Controllers/orderController');
const paymentRouter = express.Router();

paymentRouter.post('/task/webhook', express.raw({ type: 'application/json' }), maintenanceTaskController.stripeWebhook);
paymentRouter.post('/order/webhook', express.raw({ type: 'application/json' }), orderController.stripeWebhook);
paymentRouter.post('/task/payment-intent', express.json(), protect, authorize('owner'), maintenanceTaskController.createPaymentIntent);
paymentRouter.post('/order/payment-intent', express.json(), protect, authorize('manager'), orderController.createPaymentIntentForOrder);

module.exports = paymentRouter;