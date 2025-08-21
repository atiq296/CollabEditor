const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

// Get global chat history (last 100 messages)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ messageType: 'global' })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    
    // Reverse to get chronological order
    res.json(messages.reverse());
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Get document-specific chat history
router.get('/document/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const messages = await ChatMessage.getDocumentChatHistory(documentId, 100);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching document chat history:', err);
    res.status(500).json({ message: 'Failed to fetch document chat history' });
  }
});

// Get private messages between two users
router.get('/private/:recipient', authMiddleware, async (req, res) => {
  try {
    const { recipient } = req.params;
    const sender = req.user.name; // From auth middleware
    
    const messages = await ChatMessage.getPrivateMessages(sender, recipient, 100);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching private messages:', err);
    res.status(500).json({ message: 'Failed to fetch private messages' });
  }
});

// Save a new global chat message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { user, text, time } = req.body;
    
    if (!user || !text || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = new ChatMessage({
      user,
      text,
      time,
      timestamp: new Date(),
      messageType: 'global'
    });

    await newMessage.save();
    
    // Cleanup old messages if needed
    await ChatMessage.cleanupOldMessages();
    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ message: 'Failed to save message' });
  }
});

// Save a new document chat message
router.post('/document/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { user, text, time } = req.body;
    
    if (!user || !text || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = new ChatMessage({
      user,
      text,
      time,
      timestamp: new Date(),
      documentId,
      messageType: 'document'
    });

    await newMessage.save();
    
    // Cleanup old messages if needed
    await ChatMessage.cleanupOldMessages();
    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error saving document chat message:', err);
    res.status(500).json({ message: 'Failed to save document message' });
  }
});

// Save a new private message
router.post('/private', authMiddleware, async (req, res) => {
  try {
    const { recipient, text, time } = req.body;
    const sender = req.user.name;
    
    if (!recipient || !text || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = new ChatMessage({
      user: sender,
      text,
      time,
      timestamp: new Date(),
      isPrivate: true,
      recipient,
      messageType: 'private'
    });

    await newMessage.save();
    
    // Cleanup old messages if needed
    await ChatMessage.cleanupOldMessages();
    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error saving private message:', err);
    res.status(500).json({ message: 'Failed to save private message' });
  }
});

// Clear chat history (admin only)
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await ChatMessage.deleteMany({});
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

// Get online users for a document
router.get('/users/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    
    // This would typically come from Socket.IO active users
    // For now, we'll return a placeholder
    res.json([]);
  } catch (err) {
    console.error('Error fetching online users:', err);
    res.status(500).json({ message: 'Failed to fetch online users' });
  }
});

module.exports = router; 