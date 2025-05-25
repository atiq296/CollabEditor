const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  documentId:  { type: String,  required: true, index: true },
  sender:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipients:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // [] = broadcast
  content:     { type: String, required: true },
  createdAt:   { type: Date,   default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
