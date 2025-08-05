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

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const versionRoutes = require('./routes/Version');
app.use('/api/Version', versionRoutes);

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

  // --- Global Chat handlers ---
  socket.on('join-global-chat', ({ username }) => {
    socket.join('global-chat');
    console.log(`💬 ${username} joined global chat`);
  });

  socket.on('global-chat-message', async (message) => {
    try {
      // Save to database
      const ChatMessage = require('./models/Chat');
      const newMessage = new ChatMessage({
        user: message.user,
        text: message.text,
        time: message.time,
        timestamp: new Date()
      });
      await newMessage.save();
      
      // Cleanup old messages
      await ChatMessage.cleanupOldMessages();
      
      // Broadcast to all users in global chat
      io.to('global-chat').emit('global-chat-message', message);
      console.log(`💬 [Global] ${message.user}: ${message.text}`);
    } catch (err) {
      console.error('Error saving global chat message:', err);
    }
  });
  // --- End Global Chat handlers ---

  // --- Document Chat handlers ---
  socket.on('join-chat', ({ documentId, username }) => {
    socket.join('chat-' + documentId);
    // Optionally: send chat history here
    console.log(`💬 ${username} joined chat for ${documentId}`);
  });

  socket.on('chat-message', ({ documentId, user, text, time }) => {
    io.to('chat-' + documentId).emit('chat-message', { user, text, time });
    console.log(`💬 [${documentId}] ${user}: ${text}`);
  });
  // --- End Document Chat handlers ---

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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running at http://0.0.0.0:${PORT}`);
});
