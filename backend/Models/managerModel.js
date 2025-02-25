const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{type:String,default:"manager"},
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId },
    registrationDate: { type: Date, default: Date.now },
    profilePicture: { type: String, default: null },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' } // Link to the store they manage
},{timestamps:true});

const Manager = mongoose.model('Manager', managerSchema);
module.exports = Manager;