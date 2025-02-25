const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phoneNumber: {
        type: String,
        validate: {
            validator: function (v) {
                return /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`,
        },
    },
    email: {
        type: String,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`,
        },
    },
    address: { type: String },
    role:{type:String,default:"vendor"},
    specialization: { type: String },
    website: { type: String },
}, { timestamps: true }); // Added timestamps

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;