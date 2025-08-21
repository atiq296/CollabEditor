const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  // New fields for enhanced chat functionality
  documentId: {
    type: String,
    default: null // null for global chat, documentId for document-specific chat
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  recipient: {
    type: String,
    default: null // for private messages
  },
  messageType: {
    type: String,
    enum: ['global', 'document', 'private'],
    default: 'global'
  }
}, {
  timestamps: true
});

// Index for efficient querying by timestamp
chatMessageSchema.index({ timestamp: -1 });

// Index for document-specific messages
chatMessageSchema.index({ documentId: 1, timestamp: -1 });

// Index for private messages
chatMessageSchema.index({ isPrivate: 1, user: 1, recipient: 1, timestamp: -1 });

// TTL index to automatically delete messages 24 hours after creation
// Uses Mongoose's built-in createdAt field from { timestamps: true }
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Limit the number of messages stored (keep last 1000 messages)
chatMessageSchema.statics.cleanupOldMessages = async function() {
  const count = await this.countDocuments();
  if (count > 1000) {
    const messagesToDelete = count - 1000;
    const oldestMessages = await this.find()
      .sort({ timestamp: 1 })
      .limit(messagesToDelete)
      .select('_id');
    
    if (oldestMessages.length > 0) {
      await this.deleteMany({
        _id: { $in: oldestMessages.map(msg => msg._id) }
      });
    }
  }
};

// Get document-specific chat history
chatMessageSchema.statics.getDocumentChatHistory = async function(documentId, limit = 100) {
  return await this.find({ 
    documentId: documentId,
    isPrivate: false 
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .then(messages => messages.reverse());
};

// Get private messages between two users
chatMessageSchema.statics.getPrivateMessages = async function(user1, user2, limit = 100) {
  return await this.find({
    isPrivate: true,
    $or: [
      { user: user1, recipient: user2 },
      { user: user2, recipient: user1 }
    ]
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
    .then(messages => messages.reverse());
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 