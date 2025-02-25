const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role:{type:String,default:"admin"},
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    registrationDate: { type: Date, default: Date.now },
    profilePicture: { type: String, default: null }
},{timestamps:true});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;