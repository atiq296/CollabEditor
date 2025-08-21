require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// ✅ File Upload Configuration
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

// Create upload directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

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

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload size limit for large documents/images
app.use(express.urlencoded({ extended: true }));

// ✅ Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  // Typing indicators for document chat
  socket.on('typing-start', ({ documentId, username }) => {
    socket.to('chat-' + documentId).emit('user-typing', { username, isTyping: true });
    console.log(`⌨️ ${username} started typing in ${documentId}`);
  });

  socket.on('typing-stop', ({ documentId, username }) => {
    socket.to('chat-' + documentId).emit('user-typing', { username, isTyping: false });
    console.log(`⌨️ ${username} stopped typing in ${documentId}`);
  });

  // Typing indicators for global chat
  socket.on('global-typing-start', ({ username }) => {
    socket.to('global-chat').emit('global-user-typing', { username, isTyping: true });
    console.log(`⌨️ ${username} started typing in global chat`);
  });

  socket.on('global-typing-stop', ({ username }) => {
    socket.to('global-chat').emit('global-user-typing', { username, isTyping: false });
    console.log(`⌨️ ${username} stopped typing in global chat`);
  });

  // --- Private Messaging handlers ---
  socket.on('join-private-chat', ({ fromUser, toUser }) => {
    const roomId = [fromUser, toUser].sort().join('-');
    socket.join('private-' + roomId);
    console.log(`🔒 ${fromUser} joined private chat with ${toUser} (room: ${roomId})`);
  });

  socket.on('private-message', ({ fromUser, toUser, text, time }) => {
    const roomId = [fromUser, toUser].sort().join('-');
    const message = { fromUser, toUser, text, time, timestamp: new Date() };
    
    // Emit to both users in the private room
    io.to('private-' + roomId).emit('private-message', message);
    console.log(`🔒 [${roomId}] ${fromUser} -> ${toUser}: ${text}`);
  });

  socket.on('private-typing-start', ({ fromUser, toUser }) => {
    const roomId = [fromUser, toUser].sort().join('-');
    socket.to('private-' + roomId).emit('private-user-typing', { username: fromUser, isTyping: true });
    console.log(`🔒⌨️ ${fromUser} started typing to ${toUser}`);
  });

  socket.on('private-typing-stop', ({ fromUser, toUser }) => {
    const roomId = [fromUser, toUser].sort().join('-');
    socket.to('private-' + roomId).emit('private-user-typing', { username: fromUser, isTyping: false });
    console.log(`🔒⌨️ ${fromUser} stopped typing to ${toUser}`);
  });
  // --- End Private Messaging handlers ---

  // --- End Document Chat handlers ---

  socket.on('send-changes', ({ documentId, delta }) => {
    socket.to(documentId).emit('receive-changes', delta);
  });

  // Cursor tracking: Handle cursor position updates
  socket.on('cursor-change', ({ documentId, userId, username, range }) => {
    // Broadcast cursor position to other users in the same document
    socket.to(documentId).emit('remote-cursor', {
      userId,
      username,
      range,
      timestamp: Date.now()
    });
    console.log(`👆 Cursor update from ${username} in ${documentId}`);
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
