const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('express-async-handler');
const Payments = require('../Models/paymentModel'); // Adjust path
const MaintenanceTask = require('../Models/maintenanceTaskModel'); // Adjust path
const Store = require('../Models/storeModel'); //adjust path


const createPaymentIntent = asyncHandler(async (req, res) => {
    const { amount, currency, userId, taskId } = req.body; // Amount in cents

    const storeId = req.user.storeId; // Get storeId from the manager's token

    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ message: 'Invalid or missing store ID from manager token' });
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: userId,
                taskId: taskId,
                storeId: storeId
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe Payment Intent Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const stripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            handlePaymentIntentSucceeded(paymentIntentSucceeded);
            break;
        case 'payment_intent.payment_failed':
            const paymentIntentFailed = event.data.object;
            handlePaymentIntentFailed(paymentIntentFailed);
            break;
        case 'payment_intent.canceled':
            const paymentIntentCanceled = event.data.object;
            handlePaymentIntentCanceled(paymentIntentCanceled);
            break;
        case 'charge.succeeded':
            const chargeSucceeded = event.data.object;
            handleChargeSucceeded(chargeSucceeded);
            break;
        // ... handle other event types ...
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 res to acknowledge receipt of the event
    res.send('OK');
});

const handlePaymentIntentSucceeded = async (paymentIntent) => {
    const { userId, taskId, storeId } = paymentIntent.metadata;
    const { amount, currency, id: stripePaymentIntentId } = paymentIntent;

    try {
        const payment = await Payments.create({
            userId,
            taskId,
            amount,
            currency,
            stripePaymentIntentId,
            paymentStatus: 'succeeded',
            storeId: storeId
        });
        console.log(`Payment created: ${payment._id}`);

        // Update task status if taskId is available
        if (taskId) {
            await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'succeeded' });
        }

        //update store payment history
        if(storeId){
          const store = await Store.findById(storeId);
          if(store){
            store.paymentHistory.push(payment._id);
            await store.save();
          }
        }

    } catch (error) {
        console.error('Error creating payment record:', error);
    }

    console.log(`PaymentIntent for ${amount} ${currency} succeeded for user ${userId}!`);
};

const handlePaymentIntentFailed = async (paymentIntent) => {
    const { userId, taskId, storeId } = paymentIntent.metadata;
    const { amount, currency, id: stripePaymentIntentId } = paymentIntent;

    try {
        const payment = await Payments.create({
            userId,
            taskId,
            amount,
            currency,
            stripePaymentIntentId,
            paymentStatus: 'failed',
            storeId: storeId
        });
        console.log(`Payment created: ${payment._id}`);

        // Update task status if taskId is available
        if (taskId) {
            await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'failed' });
        }

    } catch (error) {
        console.error('Error creating payment record:', error);
    }
    console.log(`PaymentIntent failed: ${paymentIntent.id}`);
};

const handlePaymentIntentCanceled = async (paymentIntent) => {
    const { userId, taskId, storeId } = paymentIntent.metadata;
    const { amount, currency, id: stripePaymentIntentId } = paymentIntent;

    try {
        const payment = await Payments.create({
            userId,
            taskId,
            amount,
            currency,
            stripePaymentIntentId,
            paymentStatus: 'pending',
            storeId: storeId
        });
        console.log(`Payment created: ${payment._id}`);

        // Update task status if taskId is available
        if (taskId) {
            await MaintenanceTask.findByIdAndUpdate(taskId, { paymentStatus: 'pending' });
        }

    } catch (error) {
        console.error('Error creating payment record:', error);
    }
    console.log(`PaymentIntent canceled: ${paymentIntent.id}`);
};

const handleChargeSucceeded = async (charge) => {
    console.log(`Charge succeeded: ${charge.id}`);
    // Handle charge succeeded (if needed)
};

module.exports = { createPaymentIntent, stripeWebhook };