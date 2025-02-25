const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{type:String,default:"owner"},
    verified: { type: Boolean, default: false },
    registrationDate: { type: Date, default: Date.now },
    profilePicture: { type: String, default: null },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
    },
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }], // Array of vehicle IDs
    complaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }], // Array of complaint IDs
    paymentMethods: [{
        type: { type: String, enum: ['creditCard', 'paypal', 'other'] },
        details: { type: String }, // Store encrypted details or references
    }],
    preferences: {
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
        // Add more preferences as needed
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin: { type: Date },
    stripeCustomerId: { type: String },
}, { timestamps: true });

const Owner = mongoose.model('Owner', ownerSchema);
module.exports = Owner;