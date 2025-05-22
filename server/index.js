require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ HTTP + SOCKET.IO setup
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // frontend origin
    methods: ['GET', 'POST']
  }
});

// ✅ SOCKET.IO connection
io.on('connection', (socket) => {
  console.log('🟢 New user connected:', socket.id);

  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`📄 User ${socket.id} joined document ${documentId}`);
  });

  socket.on('send-changes', ({ documentId, delta }) => {
    socket.to(documentId).emit('receive-changes', delta);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());

// ✅ ROUTES
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

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

// ✅ START SERVER (with http server for sockets)
server.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});
