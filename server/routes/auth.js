const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ====================== SIGNUP ======================
router.post('/signup', async (req, res) => {
  console.log("📩 Received signup data:", req.body);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.log("❌ Missing fields in signup");
    return res.status(400).json({ message: "Please fill in all required fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const existingPending = await PendingUser.findOne({ email });
    if (existingPending) {
      return res.status(400).json({ message: 'Please verify OTP sent to your email or wait for OTP to expire.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pendingUser = new PendingUser({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires
    });
    await pendingUser.save();

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`
    });

    res.status(201).json({ message: 'Signup successful, please verify OTP sent to your email.' });
  } catch (err) {
    console.error("❌ Signup failed with error:", err);
    res.status(500).json({ message: 'Signup failed', error: err.message || err });
  }
});

// ====================== VERIFY OTP ======================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  try {
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) return res.status(404).json({ message: 'No pending signup for this email' });
    if (pendingUser.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (pendingUser.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });
    // Create real user with Owner role by default
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: 'Owner', // Set default role to Owner
      verified: true
    });
    await newUser.save();
    await PendingUser.deleteOne({ email });
    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

// ====================== RESEND OTP ======================
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) return res.status(404).json({ message: 'No pending signup for this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    pendingUser.otp = otp;
    pendingUser.otpExpires = otpExpires;
    await pendingUser.save();

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code (Resent)',
      text: `Your new OTP code is: ${otp}`
    });

    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend OTP', error: err.message });
  }
});

// ====================== LOGIN ======================
router.post('/login', async (req, res) => {
  console.log("🔐 Login attempt:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow login if verified
    if (!user.verified) return res.status(401).json({ message: 'Please verify your email with OTP before logging in.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    // ✅ Include name in the JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log("✅ Login successful:", user.email);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.log("❌ Login error:", err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ====================== GET CURRENT USER PROFILE ======================
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: err.message });
  }
});

// ====================== GET FRIENDS/USERS ======================
router.get('/friends', require('../middleware/auth'), async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('name email role createdAt')
      .sort({ name: 1 });
    console.log('Friends list requested:', {
      requestingUserId: req.userId,
      totalUsers: users.length,
      users: users.map(u => ({ name: u.name, email: u.email, role: u.role }))
    });
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch friends:', err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// ====================== DEBUG: GET ALL USERS ======================
router.get('/debug/users', require('../middleware/auth'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role verified createdAt')
      .sort({ createdAt: -1 });
    console.log('Debug: All users requested:', {
      requestingUserId: req.userId,
      totalUsers: users.length,
      users: users.map(u => ({ 
        name: u.name, 
        email: u.email, 
        role: u.role, 
        verified: u.verified,
        createdAt: u.createdAt
      }))
    });
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch all users:', err);
    res.status(500).json({ message: 'Failed to fetch all users', error: err.message });
  }
});

// ====================== REQUEST PASSWORD RESET ======================
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    // Send reset email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Click the link to reset your password: ${resetUrl}`
    });
    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset email', error: err.message });
  }
});

// ====================== RESET PASSWORD ======================
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and new password required' });
  try {
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
});

module.exports = router;
