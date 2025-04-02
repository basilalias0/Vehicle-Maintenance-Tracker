const express = require('express');
const app = express()
const orderRouter = express.Router();
const orderController = require('../Controllers/orderController'); // Assuming your controller is in this path
const { protect, authorize } = require('../Middlewares/authMiddleware'); // Assuming you have auth middleware






// Create Payment Intent and Order
orderRouter.post('/create-payment-intent', protect, authorize('manager'), orderController.createPaymentIntentForOrder);

// Get Orders by Store
orderRouter.get('/', protect, authorize('manager'), orderController.getOrdersByStore);


// Delete Order
orderRouter.delete('/:orderId', protect, authorize('manager'), orderController.deleteOrder);

module.exports = orderRouter;