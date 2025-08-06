const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  content: { type: String, required: true },
  title: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Version', versionSchema);
