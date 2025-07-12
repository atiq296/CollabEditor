const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

// Get chat history (last 100 messages)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find()
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

// Save a new chat message
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
      timestamp: new Date()
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

// Clear chat history (admin only)
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await ChatMessage.deleteMany({});
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    console.error('Error clearing chat history:', err);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

module.exports = router; 