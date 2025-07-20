const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  otp: String,
  otpExpires: Date
});

module.exports = mongoose.model('PendingUser', pendingUserSchema, 'pending_users'); 