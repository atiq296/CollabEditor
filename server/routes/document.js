const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const authMiddleware = require('../middleware/auth');

// Create new document
router.post('/create', authMiddleware, async (req, res) => {
  const { title } = req.body;

  try {
    const newDoc = new Document({
      title,
      createdBy: req.userId,
      collaborators: [req.userId]
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ message: 'Document creation failed', error: err.message });
  }
});

// ✅ GET document by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch document", error: err.message });
  }
});

// ✅ PUT to update content
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    const updatedDoc = await Document.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!updatedDoc) return res.status(404).json({ message: 'Document not found' });

    res.status(200).json(updatedDoc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update document', error: err.message });
  }
});

module.exports = router;
