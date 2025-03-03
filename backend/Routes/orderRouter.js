const express = require('express');
const orderRouter = express.Router();
const orderController = require('../Controllers/orderController');
const { protect, authorize } = require('../Middlewares/authMiddleware');

orderRouter.post('/', protect, authorize('manager'), orderController.createOrder);
orderRouter.get('/', protect, authorize('manager'), orderController.getOrdersByStore);
orderRouter.put('/status', protect, authorize('admin', 'manager'), orderController.updateOrderStatus);
orderRouter.post('/payment-intent', protect, authorize('manager'), orderController.createPaymentIntentForOrder);

module.exports = orderRouter;