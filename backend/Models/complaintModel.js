const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true,
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'escalated'],
        default: 'open',
    },
    escalated: {
        type: Boolean,
        default: false,
    },
    adminAction: {
        type: String,
    },
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', ComplaintSchema);

module.exports = Complaint;