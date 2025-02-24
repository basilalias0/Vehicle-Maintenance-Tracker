const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'professional', 'admin'], required: true },
  verified: { type: Boolean, default: false },
  registrationDate: { type: Date, default: Date.now },
  stripeCustomerId: { type: String, default: null },
  stripeConnectAccountId: { type: String, default: null },
  profilePicture: { type: String, default: null }
});

const User= mongoose.model('User', userSchema);
module.exports = User;