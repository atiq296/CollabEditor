const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  collaborators: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['Editor', 'Viewer'], default: 'Viewer' }
    }
  ],
  versions: [
  {
    content: String,
    title: String,
    savedAt: Date,
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
],
  comments: [
    {
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      position: {
        index: Number,
        length: Number
      },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  spreadsheet: {
    data: { type: Array, default: [] },
    columnHeaders: { type: Object, default: {} },
    rowHeaders: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
