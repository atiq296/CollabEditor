const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ✅ List documents created or shared with logged-in user
router.get('/mydocs', authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { createdBy: req.userId },
        { 'collaborators.user': req.userId }
      ]
    }).sort({ updatedAt: -1 });

    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch documents", error: err.message });
  }
});

// ✅ Create new document
router.post('/create', authMiddleware, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });

  try {
    const newDoc = new Document({
      title,
      content: "",
      createdBy: req.userId,
      collaborators: [{ user: req.userId, role: 'Editor' }]
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: 'Document creation failed', error: err.message });
  }
});

// ✅ Share document with a user (by email)
router.post('/:id/share', authMiddleware, async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) return res.status(400).json({ message: "Email and role are required" });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid document ID" });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only owner can share" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = doc.collaborators.find(c => c.user && c.user.toString() === user._id.toString());
    if (existing) {
      existing.role = role;
    } else {
      doc.collaborators.push({ user: user._id, role });
    }

    await doc.save();
    res.status(200).json({ message: "Shared successfully" });
  } catch (err) {
    console.error("❌ Share failed:", err);
    res.status(500).json({ message: "Sharing failed", error: err.message });
  }
});

// ✅ Get document by ID
router.get('/:id', authMiddleware, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid document ID" });
  }

  try {
    const doc = await Document.findById(req.params.id)
      .populate('comments.author', 'name')
      .populate('collaborators.user', 'name email');

    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.createdBy.equals(req.userId);
    const isCollaborator = doc.collaborators.some(c => c.user._id.equals(req.userId));

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch document", error: err.message });
  }
});

// ✅ Update document content and title
router.put('/:id', authMiddleware, async (req, res) => {
  const { content, title } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid document ID" });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.createdBy.equals(req.userId);
    const isEditor = doc.collaborators.some(
      c => c.user.equals(req.userId) && c.role === 'Editor'
    );

    if (!isOwner && !isEditor) return res.status(403).json({ message: "No permission to edit" });

    if (content !== undefined) doc.content = content;
    if (title !== undefined && title.trim().length > 0) doc.title = title.trim();

    await doc.save();
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update document', error: err.message });
  }
});

// ✅ Add inline comment
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text, position } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid document ID" });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const isOwner = doc.createdBy.equals(req.userId);
    const isEditor = doc.collaborators.some(
      c => c.user.equals(req.userId) && c.role === 'Editor'
    );

    if (!isOwner && !isEditor) return res.status(403).json({ message: "No permission to comment" });

    const newComment = {
      text,
      author: req.userId,
      position
    };

    doc.comments.push(newComment);
    await doc.save();

    const addedComment = doc.comments[doc.comments.length - 1];
    res.status(201).json(addedComment);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
});

module.exports = router;
