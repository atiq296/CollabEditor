const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Owner', 'Editor', 'Viewer'], default: 'Owner' },
  // Profile fields
  phone: { type: String },
  location: { type: String },
  company: { type: String },
  education: { type: String },
  bio: { type: String },
  website: { type: String },
  linkedin: { type: String },
  github: { type: String },
  twitter: { type: String },
  avatar: { type: String }, // Store filename of uploaded avatar
  // Authentication fields
  otp: { type: String },
  otpExpires: { type: Date },
  verified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
