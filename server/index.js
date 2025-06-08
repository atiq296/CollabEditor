require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ Create HTTP server and wrap with Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const documentRoutes = require('./routes/document');
app.use('/api/document', documentRoutes);

// ✅ Socket.IO Setup — this MUST come AFTER `io` is defined
const activeUsers = {}; // userId -> name

io.on('connection', (socket) => {
  console.log('🟢 Connected:', socket.id);

  socket.on('join-document', ({ documentId, username }) => {
    socket.join(documentId);
    activeUsers[socket.id] = username;

    // Notify others
    io.to(documentId).emit('user-list', Object.values(activeUsers));
    console.log(`👥 ${username} joined ${documentId}`);
  });

  socket.on('send-changes', ({ documentId, delta }) => {
    socket.to(documentId).emit('receive-changes', delta);
  });

  socket.on('disconnect', () => {
    const name = activeUsers[socket.id];
    delete activeUsers[socket.id];
    io.emit('user-list', Object.values(activeUsers));
    console.log('🔴 Disconnected:', name || socket.id);
  });
});

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

// ✅ Ping Route
app.get('/api/ping', (req, res) => {
  res.send('✅ Backend is up and running');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
