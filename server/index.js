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
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB for Socket.IO
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload size limit for large documents
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
const activeUsers = {}; // socketId -> { username, userId, documentId, lastSeen }
const typingUsers = {}; // documentId -> Set of typing usernames
const privateTypingUsers = {}; // recipient -> Set of typing usernames

io.on('connection', (socket) => {
  console.log('🟢 Connected:', socket.id);

  socket.on('join-document', ({ documentId, username, userId }) => {
    socket.join(documentId);
    activeUsers[socket.id] = { 
      username, 
      userId, 
      documentId, 
      lastSeen: Date.now(),
      isOnline: true
    };
    
    // Initialize typing set for document if not exists
    if (!typingUsers[documentId]) {
      typingUsers[documentId] = new Set();
    }
    
    // Notify others with enhanced user info
    const usersInDocument = Object.values(activeUsers)
      .filter(user => user.documentId === documentId && user.isOnline)
      .map(user => ({
        username: user.username,
        userId: user.userId,
        lastSeen: user.lastSeen
      }));
    
    // Send both the new format (for enhanced components) and maintain backward compatibility
    io.to(documentId).emit('user-list', usersInDocument);
    // Also emit the old format for backward compatibility
    io.to(documentId).emit('user-list-simple', usersInDocument.map(u => u.username));
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
        timestamp: new Date(),
        messageType: 'global'
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

  // Global typing indicator
  socket.on('global-typing-start', ({ username }) => {
    socket.to('global-chat').emit('global-typing-start', { username });
  });

  socket.on('global-typing-stop', ({ username }) => {
    socket.to('global-chat').emit('global-typing-stop', { username });
  });
  // --- End Global Chat handlers ---

  // --- Document Chat handlers ---
  socket.on('join-chat', ({ documentId, username }) => {
    socket.join('chat-' + documentId);
    
    // Send chat history for this document
    const ChatMessage = require('./models/Chat');
    ChatMessage.getDocumentChatHistory(documentId, 50)
      .then(messages => {
        socket.emit('chat-history', messages);
      })
      .catch(err => {
        console.error('Error fetching chat history:', err);
      });
      
    console.log(`💬 ${username} joined chat for ${documentId}`);
  });

  socket.on('chat-message', async ({ documentId, user, text, time }) => {
    try {
      // Save to database
      const ChatMessage = require('./models/Chat');
      const newMessage = new ChatMessage({
        user: user,
        text: text,
        time: time,
        timestamp: new Date(),
        documentId: documentId,
        messageType: 'document'
      });
      await newMessage.save();
      
      // Cleanup old messages
      await ChatMessage.cleanupOldMessages();
      
      // Broadcast to document chat room
      io.to('chat-' + documentId).emit('chat-message', { user, text, time });
      console.log(`💬 [${documentId}] ${user}: ${text}`);
    } catch (err) {
      console.error('Error saving document chat message:', err);
    }
  });

  // Document typing indicators
  socket.on('typing-start', ({ documentId, username }) => {
    if (!typingUsers[documentId]) {
      typingUsers[documentId] = new Set();
    }
    typingUsers[documentId].add(username);
    socket.to('chat-' + documentId).emit('typing-start', { username });
  });

  socket.on('typing-stop', ({ documentId, username }) => {
    if (typingUsers[documentId]) {
      typingUsers[documentId].delete(username);
    }
    socket.to('chat-' + documentId).emit('typing-stop', { username });
  });
  // --- End Document Chat handlers ---

  // --- Private Chat handlers ---
  socket.on('private-message', async ({ from, to, text, time }) => {
    try {
      // Save to database
      const ChatMessage = require('./models/Chat');
      const newMessage = new ChatMessage({
        user: from,
        text: text,
        time: time,
        timestamp: new Date(),
        isPrivate: true,
        recipient: to,
        messageType: 'private'
      });
      await newMessage.save();
      
      // Find recipient's socket
      const recipientSocket = Object.entries(activeUsers)
        .find(([_, user]) => user.username === to);
      
      if (recipientSocket) {
        const [recipientSocketId] = recipientSocket;
        io.to(recipientSocketId).emit('private-message', { from, text, time });
      }
      
      // Send back to sender for confirmation
      socket.emit('private-message-sent', { to, text, time });
      console.log(`💬 [Private] ${from} -> ${to}: ${text}`);
    } catch (err) {
      console.error('Error saving private message:', err);
    }
  });

  socket.on('get-private-history', async ({ from, to }) => {
    try {
      const ChatMessage = require('./models/Chat');
      const messages = await ChatMessage.getPrivateMessages(from, to, 50);
      socket.emit('private-history', messages);
    } catch (err) {
      console.error('Error fetching private chat history:', err);
    }
  });

  // Private typing indicators
  socket.on('private-typing-start', ({ from, to }) => {
    const recipientSocket = Object.entries(activeUsers)
      .find(([_, user]) => user.username === to);
    
    if (recipientSocket) {
      const [recipientSocketId] = recipientSocket;
      io.to(recipientSocketId).emit('private-typing-start', { from });
    }
  });

  socket.on('private-typing-stop', ({ from, to }) => {
    const recipientSocket = Object.entries(activeUsers)
      .find(([_, user]) => user.username === to);
    
    if (recipientSocket) {
      const [recipientSocketId] = recipientSocket;
      io.to(recipientSocketId).emit('private-typing-stop', { from });
    }
  });
  // --- End Private Chat handlers ---

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

  socket.on('import-content', ({ documentId, content }) => {
    // Broadcast imported content to all users in the document
    try {
      console.log(`📄 Broadcasting imported content for ${documentId}, size: ${content.length} characters`);
      
      // For very large content, split into chunks if needed
      const maxChunkSize = 10 * 1024 * 1024; // 10MB chunks
      
      if (content.length > maxChunkSize) {
        console.log(`📦 Large content detected, splitting into chunks...`);
        const chunks = [];
        for (let i = 0; i < content.length; i += maxChunkSize) {
          chunks.push(content.slice(i, i + maxChunkSize));
        }
        
        // Send chunk info first
        io.to(documentId).emit('import-content-start', { 
          totalChunks: chunks.length, 
          totalSize: content.length 
        });
        
        // Send chunks sequentially
        chunks.forEach((chunk, index) => {
          setTimeout(() => {
            io.to(documentId).emit('import-content-chunk', { 
              chunk, 
              index, 
              totalChunks: chunks.length 
            });
          }, index * 100); // 100ms delay between chunks
        });
        
        // Send completion signal
        setTimeout(() => {
          io.to(documentId).emit('import-content-complete', { 
            totalChunks: chunks.length 
          });
        }, chunks.length * 100 + 100);
        
        console.log(`✅ Large content split into ${chunks.length} chunks and broadcasted`);
      } else {
        // Send content directly for smaller files
        io.to(documentId).emit('receive-imported-content', content);
        console.log(`✅ Imported content broadcasted successfully for ${documentId}`);
      }
    } catch (error) {
      console.error(`❌ Error broadcasting imported content for ${documentId}:`, error);
    }
  });

  socket.on('update-document', ({ documentId, content }) => {
    // Broadcast the updated document content to all users in the document
    io.to(documentId).emit('document-updated', content);
    console.log(`📄 Document updated for ${documentId}`);
  });

  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      delete activeUsers[socket.id];
      
      // Update user list for the document they were in
      if (user.documentId) {
        const usersInDocument = Object.values(activeUsers)
          .filter(u => u.documentId === user.documentId && u.isOnline)
          .map(u => ({
            username: u.username,
            userId: u.userId,
            lastSeen: u.lastSeen
          }));
        
        // Send both the new format (for enhanced components) and maintain backward compatibility
        io.to(user.documentId).emit('user-list', usersInDocument);
        // Also emit the old format for backward compatibility
        io.to(user.documentId).emit('user-list-simple', usersInDocument.map(u => u.username));
      }
      
      console.log('🔴 Disconnected:', user.username || socket.id);
    }
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
