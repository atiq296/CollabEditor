const mongoose = require('mongoose');

const documentChatMessageSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    index: true
  },
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

// Compound index for efficient querying by document and timestamp
documentChatMessageSchema.index({ documentId: 1, timestamp: -1 });

// Limit the number of messages stored per document (keep last 500 messages per document)
documentChatMessageSchema.statics.cleanupOldMessages = async function(documentId) {
  const count = await this.countDocuments({ documentId });
  if (count > 500) {
    const messagesToDelete = count - 500;
    const oldestMessages = await this.find({ documentId })
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

module.exports = mongoose.model('DocumentChatMessage', documentChatMessageSchema);