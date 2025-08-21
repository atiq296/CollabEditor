const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

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
      collaborators: [] // Don't add creator as collaborator - they are the owner
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

  console.log('🔗 Share request:', {
    documentId: req.params.id,
    sharedBy: req.userId,
    email: email,
    role: role
  });

  if (!email || !role) return res.status(400).json({ message: "Email and role are required" });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid document ID" });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    console.log('📄 Document found:', {
      documentId: doc._id,
      title: doc.title,
      createdBy: doc.createdBy,
      isSpreadsheet: !!(doc.spreadsheet && Array.isArray(doc.spreadsheet.data) && doc.spreadsheet.data.length > 0)
    });

    // All authenticated users can share documents
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for sharing:', {
        email: email,
        searchedEmail: email.toLowerCase(),
        totalUsers: await User.countDocuments()
      });
      
      // Check if there are any users with similar emails
      const similarUsers = await User.find({ 
        email: { $regex: email.split('@')[0], $options: 'i' } 
      }).select('email name');
      console.log('🔍 Similar users found:', similarUsers);
      
      return res.status(404).json({ message: "User not found" });
    }

    console.log('👤 User found for sharing:', {
      userId: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      role: user.role
    });

    const existing = doc.collaborators.find(c => c.user && c.user.toString() === user._id.toString());
    if (existing) {
      existing.role = role;
      console.log('🔄 Updated existing collaborator role:', {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        oldRole: existing.role,
        newRole: role
      });
    } else {
      doc.collaborators.push({ user: user._id, role });
      console.log('➕ Added new collaborator:', {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        role: role
      });
    }

    await doc.save();

    console.log('💾 Document saved with collaborators:', doc.collaborators.map(c => ({
      userId: c.user,
      role: c.role
    })));

    // Send email notification to the shared user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Determine if it's a spreadsheet or document and generate correct URL
    const isSpreadsheet = doc.spreadsheet && Array.isArray(doc.spreadsheet.data) && doc.spreadsheet.data.length > 0;
    const docType = isSpreadsheet ? 'spreadsheet' : 'document';
    
    // Determine URL path based on role
    let urlPath;
    if (isSpreadsheet) {
      // For spreadsheets, use viewer route for viewers, editor route for editors/owners
      urlPath = role === 'Viewer' ? 'spreadsheet-viewer' : 'spreadsheet';
    } else {
      // For documents, use viewer route for viewers, editor route for editors/owners
      urlPath = role === 'Viewer' ? 'viewer' : 'editor';
    }
    
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${urlPath}/${doc._id}`;
    
    console.log('📧 Sending email with URL:', {
      to: email,
      url: url,
      role: role,
      docType: docType,
      urlPath: urlPath,
      isSpreadsheet: isSpreadsheet
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `A ${docType} was shared with you on CollabEditor`,
      text: `You have been granted access to a ${docType} titled "${doc.title}".\n\nOpen it here: ${url}`
    });

    console.log('✅ Share completed successfully');
    res.status(200).json({ message: "Shared successfully" });
  } catch (err) {
    console.error("❌ Share failed:", err);
    res.status(500).json({ message: "Sharing failed", error: err.message });
  }
});

// ✅ Get document by ID
router.get('/:id', authMiddleware, async (req, res) => {
  console.log('📄 Document GET request:', {
    documentId: req.params.id,
    userId: req.userId,
    headers: req.headers.authorization ? 'Token provided' : 'No token'
  });

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log('❌ Invalid document ID format:', req.params.id);
    return res.status(400).json({ message: "Invalid document ID" });
  }

  try {
    const doc = await Document.findById(req.params.id)
      .populate('comments.author', 'name')
      .populate('collaborators.user', 'name email');

    if (!doc) {
      console.log('❌ Document not found:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('📄 Document found:', {
      documentId: doc._id,
      title: doc.title,
      createdBy: doc.createdBy,
      collaboratorsCount: doc.collaborators.length,
      hasContent: !!doc.content,
      isSpreadsheet: !!(doc.spreadsheet && Array.isArray(doc.spreadsheet.data) && doc.spreadsheet.data.length > 0)
    });

    // All authenticated users have owner access
    console.log('✅ Document access granted for all authenticated users');
    
    // Add userRole as Owner for all users
    const responseDoc = doc.toObject();
    responseDoc.userRole = 'Owner';
    
    res.status(200).json(responseDoc);
  } catch (err) {
    console.error('❌ Document fetch error:', err);
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

    console.log('Document update attempt:', {
      documentId: req.params.id,
      userId: req.userId,
      hasContent: !!content,
      contentLength: content?.length || 0,
      hasTitle: !!title
    });

    // All authenticated users can edit
    if (content !== undefined) doc.content = content;
    if (title !== undefined && title.trim().length > 0) doc.title = title.trim();

    await doc.save();
    console.log('Document updated successfully:', {
      documentId: doc._id,
      title: doc.title,
      hasContent: !!doc.content,
      contentLength: doc.content?.length || 0
    });
    res.status(200).json(doc);
  } catch (err) {
    console.error('Document update error:', err);
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

    // All authenticated users can comment
    const newComment = {
      text,
      author: req.userId,
      position
    };

    doc.comments.push(newComment);
    await doc.save();

    const addedComment = doc.comments[doc.comments.length - 1];
    
    // Populate author info
    await doc.populate('comments.author', 'name');
    const populatedComment = doc.comments[doc.comments.length - 1];
    
    // Emit real-time update to all users in the document
    const io = require('socket.io');
    const server = require('../index');
    if (server && server.io) {
      server.io.to(req.params.id).emit('new-comment', populatedComment);
    }
    
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
});

// PATCH /api/document/:id/collaborator
router.patch('/:id/collaborator', authMiddleware, async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ message: "User ID and role are required" });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Only owner can change roles
    if (doc.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only owner can change roles" });
    }

    const collaborator = doc.collaborators.find(c => c.user.toString() === userId);
    if (!collaborator) return res.status(404).json({ message: "Collaborator not found" });

    collaborator.role = role;
    await doc.save();
    await doc.populate('collaborators.user', 'name email');
    res.json({ message: "Role updated", collaborators: doc.collaborators });
  } catch (err) {
    res.status(500).json({ message: "Failed to update role", error: err.message });
  }
});

// ✅ Get spreadsheet data
router.get('/:id/spreadsheet', authMiddleware, async (req, res) => {
  console.log('📊 Spreadsheet GET request:', {
    documentId: req.params.id,
    userId: req.userId
  });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      console.log('❌ Document not found for spreadsheet:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('📄 Document found for spreadsheet:', {
      documentId: doc._id,
      title: doc.title,
      hasSpreadsheet: !!doc.spreadsheet,
      spreadsheetData: doc.spreadsheet?.data,
      dataLength: doc.spreadsheet?.data?.length || 0,
      createdBy: doc.createdBy,
      collaboratorsCount: doc.collaborators?.length || 0
    });

    // All authenticated users can access spreadsheets
    const spreadsheetData = doc.spreadsheet?.data || [];
    const columnHeaders = doc.spreadsheet?.columnHeaders || {};
    const rowHeaders = doc.spreadsheet?.rowHeaders || {};
    
    console.log('✅ Sending spreadsheet data:', {
      dataLength: spreadsheetData.length,
      isEmpty: spreadsheetData.length === 0,
      sampleData: spreadsheetData.slice(0, 3),
      hasColumnHeaders: Object.keys(columnHeaders).length > 0,
      hasRowHeaders: Object.keys(rowHeaders).length > 0
    });

    res.status(200).json({
      data: spreadsheetData,
      columnHeaders,
      rowHeaders
    });
  } catch (err) {
    console.error('❌ Spreadsheet fetch error:', err);
    res.status(500).json({ message: "Failed to fetch spreadsheet", error: err.message });
  }
});

// ✅ Save spreadsheet data
router.put('/:id/spreadsheet', authMiddleware, async (req, res) => {
  const { data, title, columnHeaders, rowHeaders } = req.body;

  console.log('💾 Spreadsheet PUT request:', {
    documentId: req.params.id,
    userId: req.userId,
    hasData: !!data,
    dataLength: data?.length || 0,
    hasTitle: !!title,
    hasColumnHeaders: !!columnHeaders,
    hasRowHeaders: !!rowHeaders
  });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      console.log('❌ Document not found for spreadsheet save:', req.params.id);
      return res.status(404).json({ message: "Document not found" });
    }

    console.log('📄 Document found for spreadsheet save:', {
      documentId: doc._id,
      title: doc.title,
      hasSpreadsheet: !!doc.spreadsheet,
      currentDataLength: doc.spreadsheet?.data?.length || 0
    });

    // All authenticated users can save spreadsheets
    // Initialize spreadsheet if it doesn't exist
    if (!doc.spreadsheet) {
      doc.spreadsheet = { data: [], updatedAt: Date.now() };
    }

    doc.spreadsheet.data = data;
    doc.spreadsheet.updatedAt = Date.now();
    
    // Save custom headers
    if (columnHeaders !== undefined) {
      doc.spreadsheet.columnHeaders = columnHeaders;
    }
    if (rowHeaders !== undefined) {
      doc.spreadsheet.rowHeaders = rowHeaders;
    }
    
    if (title !== undefined && title.trim().length > 0) doc.title = title.trim();
    
    await doc.save();

    console.log('✅ Spreadsheet saved successfully:', {
      documentId: doc._id,
      title: doc.title,
      dataLength: doc.spreadsheet.data.length,
      updatedAt: doc.spreadsheet.updatedAt,
      columnHeadersCount: Object.keys(doc.spreadsheet.columnHeaders || {}).length,
      rowHeadersCount: Object.keys(doc.spreadsheet.rowHeaders || {}).length
    });

    res.status(200).json({ message: "Spreadsheet saved" });
  } catch (err) {
    console.error('❌ Spreadsheet save error:', err);
    res.status(500).json({ message: "Failed to save spreadsheet", error: err.message });
  }
});


module.exports = router;
