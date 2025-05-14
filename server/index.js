const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API route
app.get('/api/ping', (req, res) => {
  res.send('Server is working!');
});

// Start the server
app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});
