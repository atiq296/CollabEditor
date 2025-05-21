require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ MIDDLEWARE
app.use(cors()); // Allows frontend (port 3000) to talk to backend
app.use(express.json()); // Parses JSON body

// ✅ ROUTES
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//connect document routes
const documentRoutes = require('./routes/document');
app.use('/api/document', documentRoutes);


// ✅ MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

// ✅ TEST ROUTE
app.get('/api/ping', (req, res) => {
  res.send('Server is working!');
});

// ✅ START SERVER
app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});
