const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ====================== FILE UPLOAD CONFIGURATION ======================
const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Create upload directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  console.log('Creating avatars directory:', avatarsDir);
  fs.mkdirSync(avatarsDir, { recursive: true });
}

console.log('Upload directories configured:', { uploadsDir, avatarsDir });

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// ====================== GET USER PROFILE ======================
router.get('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
});

// ====================== UPDATE USER PROFILE ======================
router.put('/profile', require('../middleware/auth'), (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('Profile update request received:', {
      userId: req.userId,
      body: req.body,
      file: req.file ? req.file.filename : 'No file'
    });

    const {
      name,
      email,
      phone,
      location,
      company,
      education,
      bio,
      website,
      linkedin,
      github,
      twitter
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      console.log('User not found for ID:', req.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', { id: user._id, email: user.email });

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email already in use:', email);
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update profile fields
    const updateFields = {
      name: name || user.name,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone,
      location: location !== undefined ? location : user.location,
      company: company !== undefined ? company : user.company,
      education: education !== undefined ? education : user.education,
      bio: bio !== undefined ? bio : user.bio,
      website: website !== undefined ? website : user.website,
      linkedin: linkedin !== undefined ? linkedin : user.linkedin,
      github: github !== undefined ? github : user.github,
      twitter: twitter !== undefined ? twitter : user.twitter
    };

    // Handle avatar upload if present
    if (req.file) {
      updateFields.avatar = req.file.filename;
    }

    console.log('Updating user with fields:', updateFields);

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');

    if (!updatedUser) {
      console.log('Failed to update user - user not found after update');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Profile updated successfully for user:', updatedUser._id);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Failed to update user profile:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

module.exports = router;
