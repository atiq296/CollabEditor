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
  }
}, {
  timestamps: true
});

// Index for efficient querying by timestamp
chatMessageSchema.index({ timestamp: -1 });

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

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 