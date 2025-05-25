const express = require('express');
const router = express.Router();
const Chat   = require('../models/ChatMessage');
const auth   = require('../middleware/auth');

// GET /api/chat/:documentId
router.get('/:documentId', auth, async (req, res) => {
  const msgs = await Chat.find({ documentId: req.params.documentId })
                        .sort('createdAt')
                        .populate('sender', 'username');
  res.json(msgs);
});

module.exports = router;
