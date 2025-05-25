require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

// Routes & middleware
const authRoutes     = require('./routes/auth');
const documentRoutes = require('./routes/document');
const chatRoutes     = require('./routes/chat');
const authMiddleware = require('./middleware/auth');

// Models
const ChatMessage    = require('./models/ChatMessage');

const app = express();


// === Middleware ===
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// === Health Check ===
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is working!' });
});

// === API Routes ===
app.use('/api/auth', authRoutes);
app.use('/api/document', authMiddleware, documentRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// === HTTP & Socket.IO Setup ===
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// === Socket Authentication Middleware ===
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: token missing'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = payload.id;
    socket.username = payload.username;
    next();
  } catch (err) {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('🟢 New socket connected:', socket.id, 'user:', socket.userId);

  // join personal room for private messages
  socket.join(`user-${socket.userId}`);

  // document collaboration
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    // broadcast presence
    io.to(documentId).emit('presence-update', { userId: socket.userId, online: true });
  });

  socket.on('send-changes', ({ documentId, delta }) => {
    socket.to(documentId).emit('receive-changes', delta);
  });

  // real-time chat
  socket.on('send-message', async ({ documentId, content, recipients }) => {
    try {
      // persist
      const msg = await ChatMessage.create({
        documentId,
        sender: socket.userId,
        recipients: recipients || [],
        content
      });
      const payload = {
        _id:        msg._id,
        documentId,
        sender:     { _id: socket.userId, username: socket.username },
        recipients: recipients || [],
        content,
        createdAt:  msg.createdAt
      };
      // emit
      if (!recipients || recipients.length === 0) {
        io.to(documentId).emit('receive-message', payload);
      } else {
        [...recipients, socket.userId].forEach(uId =>
          io.to(`user-${uId}`).emit('receive-message', payload)
        );
      }
    } catch (err) {
      console.error('Chat message error:', err);
    }
  });

  // typing indicator
  socket.on('typing', ({ documentId, isTyping }) => {
    socket.to(documentId).emit('user-typing', { userId: socket.userId, isTyping });
  });

  // handle disconnect
  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
    // broadcast offline presence to all docs user was in
    io.emit('presence-update', { userId: socket.userId, online: false });
  });
});

// === Database Connection & Server Start ===
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

