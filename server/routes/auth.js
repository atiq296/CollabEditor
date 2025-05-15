const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ====================== SIGNUP ======================
router.post('/signup', async (req, res) => {
  console.log("📩 Received signup data:", req.body);  // Debug log

  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password) {
    console.log("❌ Missing fields in signup");
    return res.status(400).json({ message: "Please fill in all required fields" });
  }
  console.log("🚀 Signup route is live");

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'Editor'
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '2h'
    });

    console.log("✅ New user registered:", newUser.email);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
  console.error("❌ Signup failed with error:", err);
  res.status(500).json({ message: 'Signup failed', error: err.message || err });
}

});


// ====================== LOGIN ======================
router.post('/login', async (req, res) => {
  console.log("🔐 Login attempt:", req.body);

  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h'
    });

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

module.exports = router;
