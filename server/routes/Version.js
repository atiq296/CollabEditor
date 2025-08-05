const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const auth = require('../middleware/auth');

// Save a version snapshot
router.post('/:id/save-version', auth, async (req, res) => {
  const { id } = req.params;
  const { content, title } = req.body;
  const userId = req.user.id;

  try {
    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Check if user is a collaborator or owner
    const isOwner = doc.createdBy.toString() === userId;
    const isCollaborator = doc.collaborators.some(c => c.user.toString() === userId);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const versionSnapshot = {
      content,
      title,
      savedAt: new Date(),
      savedBy: userId,
    };

    doc.versions = doc.versions || [];
    doc.versions.push(versionSnapshot);
    await doc.save();

    res.status(200).json({ message: 'Version saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all versions
router.get('/:id/versions', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const doc = await Document.findById(id)
      .populate('versions.savedBy', 'name email');

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const isOwner = doc.createdBy.toString() === userId;
    const isCollaborator = doc.collaborators.some(c => c.user.toString() === userId);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json(doc.versions || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
