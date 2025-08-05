import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DocumentEditor.css';
import { 
  CircularProgress, 
  Menu, 
  Snackbar, 
  Alert, 
  Select, 
  MenuItem,
  Typography,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  ArrowBack,
  FileUpload,
  FileDownload,
  Save,
  Share,
  Settings,
  Description,
  AutoFixHigh,
  Psychology,
  Visibility,
  VisibilityOff,
  Lock,
  Edit,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function DocumentEditor() {
  const { id: documentId } = useParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Document');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({}); // Store remote cursors by user ID
  const socketRef = useRef(null);
  const quillRef = useRef(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const importInputRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [commentStatus, setCommentStatus] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // User's global role (Owner, Editor, Viewer)
  const [documentRole, setDocumentRole] = useState(null); // User's role for this specific document
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token') || '';
  const getUsername = () => {
    const token = getToken();
    if (!token) return 'Unknown';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || 'User';
    } catch {
      return 'User';
    }
  };

  const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  // Permission checks based on roles
  const isOwner = () => userRole === 'Owner' || documentRole === 'Owner';
  const isEditor = () => userRole === 'Editor' || documentRole === 'Editor';
  const isViewer = () => userRole === 'Viewer' || documentRole === 'Viewer';
  const canEdit = () => isOwner() || isEditor();
  const canShare = () => isOwner();
  const canDelete = () => isOwner();
  const canImport = () => isOwner() || isEditor();
  const canExport = () => isOwner() || isEditor();
  const canComment = () => isOwner() || isEditor();
  const canUseAI = () => isOwner() || isEditor();

  // Clean up old remote cursors (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors(prev => {
        const updated = {};
        Object.keys(prev).forEach(userId => {
          if (now - prev[userId].timestamp < 10000) { // 10 seconds
            updated[userId] = prev[userId];
          }
        });
        return updated;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Render remote cursors in the editor
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Clear existing cursors and labels
    const existingCursors = document.querySelectorAll('.remote-cursor, .remote-cursor-label');
    existingCursors.forEach(cursor => cursor.remove());

    // Add new cursors
    Object.entries(remoteCursors).forEach(([userId, cursorData]) => {
      try {
        const range = cursorData.range;
        const bounds = quill.getBounds(range.index, range.length);
        
        if (bounds && bounds.left >= 0 && bounds.top >= 0) {
          const cursorElement = document.createElement('div');
          cursorElement.className = 'remote-cursor';
          cursorElement.style.cssText = `
            position: absolute;
            left: ${bounds.left}px;
            top: ${bounds.top}px;
            width: 2px;
            height: ${bounds.height}px;
            background-color: ${getUserColor(userId)};
            z-index: 1000;
            pointer-events: none;
          `;
          
          // Add username label
          const label = document.createElement('div');
          label.className = 'remote-cursor-label';
          label.textContent = cursorData.username;
          label.style.cssText = `
            position: absolute;
            left: ${bounds.left}px;
            top: ${bounds.top - 20}px;
            background-color: ${getUserColor(userId)};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1001;
            pointer-events: none;
          `;
          
          const editorContainer = quill.container;
          if (editorContainer) {
            editorContainer.appendChild(cursorElement);
            editorContainer.appendChild(label);
          }
        }
      } catch (error) {
        console.warn('Failed to render remote cursor for user', userId, ':', error);
      }
    });
  }, [remoteCursors]);

  // Generate unique color for each user
  const getUserColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    const index = userId ? userId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length : 0;
    return colors[index];
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!canShare()) {
      alert("Only document owners can change collaborator roles.");
      return;
    }
    
    const token = getToken();
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/document/${documentId}/collaborator`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setCollaborators(data.collaborators);
    } else {
      alert(data.message || "Failed to update role");
    }
  };

  useEffect(() => {
    const token = getToken();
    
    // Fetch user profile
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setUserRole(data.role || 'Owner'); // Set user's global role
      })
      .catch(() => setUser(null));

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socketRef.current = socket;
    const username = getUsername();
    socket.emit('join-document', { documentId, username });
    socket.on('user-list', (users) => {
      setActiveUsers(users);
    });
    return () => socket.disconnect();
    // eslint-disable-next-line
  }, [documentId]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => {
        console.log('Document fetch response:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
        
        if (!res.ok) {
          return res.json().then(errorData => {
            console.error('Document fetch error response:', errorData);
            throw new Error(`HTTP ${res.status}: ${errorData.message || res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log('Document loaded successfully:', {
          id: data._id,
          title: data.title,
          content: data.content,
          contentLength: data.content?.length || 0,
          createdBy: data.createdBy,
          collaborators: data.collaborators?.length || 0,
          hasContent: !!data.content
        });
        
        setContent(data.content || '');
        setTitle(data.title || 'Untitled Document');
        setComments(data.comments || []);
        setCollaborators(data.collaborators || []);
        setOwnerId(data.createdBy || (data.createdBy?._id));
        
        // Set document role based on user's relationship to this document
        const currentUserId = getCurrentUserId();
        if (data.createdBy === currentUserId || data.createdBy?._id === currentUserId) {
          setDocumentRole('Owner');
        } else {
          // Check if user is a collaborator
          const collaborator = data.collaborators?.find(c => 
            c.user._id === currentUserId || c.user === currentUserId
          );
          if (collaborator) {
            setDocumentRole(collaborator.role);
          } else {
            setDocumentRole('Viewer'); // Default to viewer if not specified
          }
        }
      })
      .catch((error) => {
        console.error('Error loading document:', error);
        console.error('Document ID:', documentId);
        console.error('Token:', getToken() ? 'Present' : 'Missing');
        
        let errorMessage = 'Failed to load document. ';
        if (error.message.includes('403')) {
          errorMessage += 'Access denied. You may not have permission to view this document.';
        } else if (error.message.includes('404')) {
          errorMessage += 'Document not found.';
        } else if (error.message.includes('401')) {
          errorMessage += 'Authentication failed. Please log in again.';
        } else {
          errorMessage += 'Please check your permissions or try again.';
        }
        
        alert(errorMessage);
      });
  }, [documentId]);

  // Ensure ReactQuill displays content when it's loaded
  useEffect(() => {
    if (quillRef.current && content) {
      const quill = quillRef.current.getEditor();
      if (quill && quill.getContents().ops.length === 0) {
        quill.setText('');
        quill.clipboard.dangerouslyPasteHTML(content);
      }
    }
  }, [content, quillRef.current]);

  // Real-time: Listen for remote changes and update editor
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (delta) => quill.updateContents(delta);
    socket.on('receive-changes', handler);
    return () => socket.off('receive-changes', handler);
  }, [socketRef, quillRef]);

  // Real-time: Emit local changes to server
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (delta, oldDelta, source) => {
      if (source === 'user') {
        socket.emit('send-changes', { documentId, delta });
      }
    };
    quill.on('text-change', handler);
    return () => quill.off('text-change', handler);
  }, [socketRef, quillRef, documentId]);

  // Cursor tracking: Emit local cursor position
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    
    let lastCursorData = null;
    const handleSelectionChange = (range, oldRange, source) => {
      if (source === 'user' && range) {
        const cursorData = {
          documentId,
          userId: getCurrentUserId(),
          username: getUsername(),
          range: {
            index: range.index,
            length: range.length
          }
        };
        
        // Only emit if cursor position actually changed
        if (!lastCursorData || 
            lastCursorData.range.index !== cursorData.range.index ||
            lastCursorData.range.length !== cursorData.range.length) {
          socket.emit('cursor-change', cursorData);
          lastCursorData = cursorData;
        }
      }
    };
    
    quill.on('selection-change', handleSelectionChange);
    return () => quill.off('selection-change', handleSelectionChange);
  }, [socketRef, quillRef, documentId]);

  // Cursor tracking: Listen for remote cursor updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    
    const handleRemoteCursor = (cursorData) => {
      if (cursorData.userId !== getCurrentUserId()) {
        setRemoteCursors(prev => ({
          ...prev,
          [cursorData.userId]: {
            username: cursorData.username,
            range: cursorData.range,
            timestamp: Date.now()
          }
        }));
      }
    };
    
    socket.on('remote-cursor', handleRemoteCursor);
    return () => socket.off('remote-cursor', handleRemoteCursor);
  }, [socketRef]);

  const handleChange = (value) => {
    if (canEdit()) {
    setContent(value);
    }
  };

  const handleTitleChange = (e) => {
    if (canEdit()) {
    setTitle(e.target.value);
    }
  };

  const handleSave = async () => {
    if (!canEdit()) {
      alert("Only owners and editors can save changes to this document.");
      return;
    }
    
    console.log('Saving:', content, title);
    try {
      const token = getToken();
      const autoTitle =
        title.trim() ||
        (typeof content === 'string' ? content.replace(/<[^>]+>/g, "").slice(0, 30) : "") ||
        "Untitled";
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, title: autoTitle }),
      });
      if (res.ok) {
        setSaveStatus('success');
        // Notify dashboard to refresh
        window.dispatchEvent(new Event('refreshDocs'));
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Export menu handlers
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      html2pdf.default().from(document.querySelector('.ql-editor')).save(`${title}.pdf`);
    });
    handleExportClose();
  };

  const handleExportWord = async () => {
    const htmlDocx = await import('html-docx-js/dist/html-docx');
    const contentHtml = document.querySelector('.ql-editor').innerHTML;
    const converted = htmlDocx.asBlob(`<html><head><meta charset='utf-8'></head><body>${contentHtml}</body></html>`);
    const url = window.URL.createObjectURL(converted);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    handleExportClose();
  };

  // Import logic
  const handleImportClick = () => {
    if (importInputRef.current) importInputRef.current.value = null;
    importInputRef.current?.click();
  };
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.name.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setContent(result.value);
    } else if (file.name.endsWith('.html')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setContent(evt.target.result);
      };
      reader.readAsText(file);
    } else {
      alert('Only .docx and .html files are supported for import.');
    }
  };

  const handleAddComment = async () => {
    if (!canComment()) {
      alert("Only owners and editors can add comments to this document.");
      return;
    }
    
    if (newComment.trim()) {
      const token = getToken();
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: newComment,
          }),
        });
        if (res.ok) {
          const savedComment = await res.json();
          setComments([...comments, savedComment]);
      setNewComment('');
          setCommentStatus('success');
        } else {
          setCommentStatus('error');
        }
      } catch (err) {
        setCommentStatus('error');
      }
      setTimeout(() => setCommentStatus(null), 2000);
    }
  };

  const handleDeleteComment = (idx) => {
    if (!canEdit()) {
      alert("Only owners and editors can delete comments from this document.");
      return;
    }
    setComments(comments.filter((_, i) => i !== idx));
  };

  // --- AI Grammar/Tone Handlers ---
  const fetchAIResult = async (inputText, instruction) => {
    setAiLoading(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            { role: "system", content: instruction },
            { role: "user", content: inputText }
          ]
        })
      });
      const json = await response.json();
      setAiLoading(false);
      return json.choices?.[0]?.message?.content || inputText;
    } catch (err) {
      setAiLoading(false);
      return inputText;
    }
  };

  const handleImproveGrammar = async () => {
    const plainText = document.querySelector('.ql-editor')?.innerText || '';
    const improved = await fetchAIResult(
      plainText,
      "Fix grammar, punctuation, and fluency. Return only the corrected version without explanation:"
    );
    if (improved) setContent(improved);
  };

  const handleEnhanceTone = async () => {
    const plainText = document.querySelector('.ql-editor')?.innerText || '';
    const improved = await fetchAIResult(
      plainText,
      "Rewrite this text to make it more professional and engaging in tone:"
    );
    if (improved) setContent(improved);
  };

  // Calculate statistics
  const wordCount = content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.replace(/<[^>]+>/g, '').length;
  const paragraphCount = content.split('<p>').length - 1;
  const lastModified = new Date().toLocaleDateString();

  return (
    <div className="doceditor-root">
      {/* Enhanced Header with User Info */}
      <header className="doceditor-header">
        <div className="doceditor-header-content">
          <div className="doceditor-user-section">
            <div className="doceditor-user-profile">
              <Avatar 
                className="doceditor-user-avatar"
                sx={{ 
                  width: 56, 
                  height: 56, 
                  bgcolor: '#274690',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div className="doceditor-user-details">
                <Typography variant="h6" className="doceditor-user-name">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" className="doceditor-user-email">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    icon={documentRole === 'Owner' ? <AdminPanelSettings /> : documentRole === 'Editor' ? <Edit /> : <Visibility />}
                    label={`${documentRole || 'Viewer'} (Document)`}
                    size="small"
                    className="doceditor-user-role"
                    color={
                      documentRole === 'Owner' ? 'success' : 
                      documentRole === 'Editor' ? 'primary' : 
                      'default'
                    }
                  />
                  {userRole && userRole !== documentRole && (
                    <Chip 
                      icon={<Person />}
                      label={`${userRole} (Global)`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>
              </div>
            </div>
          </div>
          
          <div className="doceditor-stats-section">
            <Grid container spacing={2} className="doceditor-stats-grid">
              <Grid item xs={6} sm={3}>
                <Card className="doceditor-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="doceditor-stat-number">
                      {wordCount}
                    </Typography>
                    <Typography variant="body2" className="doceditor-stat-label">
                      Words
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="doceditor-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="doceditor-stat-number">
                      {charCount}
                    </Typography>
                    <Typography variant="body2" className="doceditor-stat-label">
                      Characters
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="doceditor-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="doceditor-stat-number">
                      {paragraphCount}
                    </Typography>
                    <Typography variant="body2" className="doceditor-stat-label">
                      Paragraphs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="doceditor-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="doceditor-stat-number">
                      {activeUsers.length}
                    </Typography>
                    <Typography variant="body2" className="doceditor-stat-label">
                      Active Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>

          <div className="doceditor-header-actions">
            <Tooltip title="Settings">
              <IconButton className="doceditor-action-btn">
                <Settings />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              color="primary"
              className="doceditor-back-btn"
          onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="doceditor-main-box">
        <div className="doceditor-title-section">
          <input
            className="doceditor-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter document title..."
            disabled={!canEdit()}
          />
          {!canEdit() && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock fontSize="small" />
              Read-only mode - You can view but not edit this document
            </Typography>
          )}
        </div>

        <div className="doceditor-actions">
          <Tooltip title={!canImport() ? "Only owners and editors can import files" : "Import document"}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                className="doceditor-action-button"
                onClick={handleImportClick}
                startIcon={<FileUpload />}
                disabled={!canImport()}
              >
                Import
              </Button>
            </span>
          </Tooltip>
            <input
              type="file"
              accept=".docx,.html"
              ref={importInputRef}
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          <Tooltip title={!canExport() ? "Only owners and editors can export files" : "Export document"}>
            <span>
              <Button
                variant="outlined"
                color="secondary"
                className="doceditor-action-button"
                onClick={handleExportClick}
                startIcon={<FileDownload />}
                disabled={!canExport()}
              >
                Export
              </Button>
            </span>
          </Tooltip>
            <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={handleExportClose}>
              <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
              <MenuItem onClick={handleExportWord}>Export as Word</MenuItem>
            </Menu>
          <Tooltip title={!canEdit() ? "Only owners and editors can save changes" : "Save document"}>
            <span>
              <Button
                variant="contained"
                color="primary"
                className="doceditor-action-button"
                onClick={handleSave}
                startIcon={<Save />}
                disabled={!canEdit()}
              >
                Save Document
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="outlined"
            color="info"
            className="doceditor-action-button"
            onClick={() => setShowSidebar(s => !s)}
            startIcon={showSidebar ? <VisibilityOff /> : <Visibility />}
          >
            {showSidebar ? 'Hide' : 'Show'} Sidebar
          </Button>
        </div>

        <div className="doceditor-ai-section">
          <Typography variant="h6" className="doceditor-ai-title">
            🤖 AI Writing Assistant
          </Typography>
          <div className="doceditor-ai-actions">
            <Tooltip title={!canUseAI() ? "Only owners and editors can use AI features" : "Improve grammar using AI"}>
              <span>
                <Button
                  variant="outlined"
                  color="warning"
                  className="doceditor-ai-button"
                  onClick={handleImproveGrammar}
                  disabled={aiLoading || !canUseAI()}
                  startIcon={<AutoFixHigh />}
                >
                  Improve Grammar
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={!canUseAI() ? "Only owners and editors can use AI features" : "Enhance tone using AI"}>
              <span>
                <Button
                  variant="outlined"
                  color="info"
                  className="doceditor-ai-button"
                  onClick={handleEnhanceTone}
                  disabled={aiLoading || !canUseAI()}
                  startIcon={<Psychology />}
                >
                  Enhance Tone
                </Button>
              </span>
            </Tooltip>
            {aiLoading && <CircularProgress size={24} sx={{ ml: 2, color: '#274690' }} />}
          </div>
        </div>

        <div className="doceditor-content-row">
          <div className="doceditor-editor-container">
            {!canEdit() && (
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: 'warning.light', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Lock fontSize="small" />
                <Typography variant="body2">
                  You are in read-only mode. Only owners and editors can make changes to this document.
                </Typography>
              </Box>
            )}
          <ReactQuill
              ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleChange}
              placeholder={canEdit() ? "Start typing here..." : "Read-only document"}
            modules={DocumentEditor.modules}
            formats={DocumentEditor.formats}
              className="doceditor-quill"
              readOnly={!canEdit()}
          />
        </div>
          
        {showSidebar && (
          <aside className="doceditor-sidebar">
              <div className="doceditor-sidebar-section">
                <Typography variant="h6" className="doceditor-section-title">
                  💬 Comments ({comments.length})
                </Typography>
            <div className="doceditor-comments-list">
                  {comments.length === 0 && (
                    <Typography variant="body2" className="doceditor-empty-text">
                      No comments yet. Start the conversation!
                    </Typography>
                  )}
              {comments.map((c, i) => (
                <div key={i} className="doceditor-comment-item">
                  <div className="doceditor-comment-meta">
                    <span className="doceditor-comment-author">
                      {c.author && typeof c.author === 'object' ? c.author.name : c.author}
                    </span>
                    {c.date && <span className="doceditor-comment-date">{c.date}</span>}
                    {canEdit() && (
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteComment(i)}
                        className="doceditor-comment-delete"
                      >
                        ×
                      </IconButton>
                    )}
                  </div>
                  <div className="doceditor-comment-text">{c.text}</div>
                </div>
              ))}
            </div>
            {canComment() ? (
            <div className="doceditor-add-comment">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                  className="doceditor-comment-textarea"
                />
                <Button 
                  onClick={handleAddComment} 
                  variant="contained" 
                  className="doceditor-comment-btn"
                  startIcon={<Share />}
                >
                  Add Comment
                </Button>
              </div>
            ) : (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Lock fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Only owners and editors can add comments
                </Typography>
              </Box>
            )}
            </div>

              <div className="doceditor-sidebar-section">
                <Typography variant="h6" className="doceditor-section-title">
                  👥 Live Collaborators ({collaborators.filter(collab => {
                    const collaboratorId = collab.user._id || collab.user;
                    const ownerIdValue = ownerId?._id || ownerId;
                    return collaboratorId !== ownerIdValue;
                  }).length})
                </Typography>
                {collaborators.filter(collab => {
                  const collaboratorId = collab.user._id || collab.user;
                  const ownerIdValue = ownerId?._id || ownerId;
                  return collaboratorId !== ownerIdValue;
                }).length === 0 && (
                  <Typography variant="body2" className="doceditor-empty-text">
                    No live collaborators yet.
                  </Typography>
                )}
              {collaborators.filter(collab => {
                const collaboratorId = collab.user._id || collab.user;
                const ownerIdValue = ownerId?._id || ownerId;
                return collaboratorId !== ownerIdValue;
              }).map((collab) => (
                  <div key={collab.user._id || collab.user} className="doceditor-collaborator-item">
                    <div className="doceditor-collaborator-info">
                      <span className="doceditor-collaborator-name">
                        {collab.user.name || collab.user.email || collab.user}
                      </span>
                      <Chip 
                        label={collab.role}
                        size="small"
                        color={collab.role === 'Editor' ? 'primary' : 'default'}
                        className="doceditor-collaborator-role"
                      />
                    </div>
                  {canShare() && (
                    <Select
                      value={collab.role}
                      onChange={e => handleRoleChange(collab.user._id || collab.user, e.target.value)}
                      size="small"
                      className="doceditor-role-select"
                    >
                      <MenuItem value="Editor">Editor</MenuItem>
                      <MenuItem value="Viewer">Viewer</MenuItem>
                    </Select>
                  )}
                </div>
              ))}
            </div>

              <div className="doceditor-sidebar-section">
                <Typography variant="h6" className="doceditor-section-title">
                  👤 Active Users ({activeUsers.length})
                </Typography>
                <div className="doceditor-active-users">
                  {activeUsers.map((u, i) => (
                    <Chip 
                      key={i} 
                      label={u} 
                      size="small" 
                      className="doceditor-user-chip"
                      color="success"
                    />
                  ))}
                </div>
            </div>
          </aside>
        )}
      </div>
      </main>

      <Snackbar open={!!saveStatus} autoHideDuration={2000} onClose={() => setSaveStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {saveStatus === 'success' ? (
          <Alert severity="success" sx={{ width: '100%' }}>
            Document saved successfully!
          </Alert>
        ) : saveStatus === 'error' ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            Failed to save document.
          </Alert>
        ) : null}
      </Snackbar>
      <Snackbar open={!!commentStatus} autoHideDuration={2000} onClose={() => setCommentStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {commentStatus === 'success' ? (
          <Alert severity="success" sx={{ width: '100%' }}>
            Comment saved successfully!
          </Alert>
        ) : commentStatus === 'error' ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            Failed to save comment.
          </Alert>
        ) : null}
      </Snackbar>
    </div>
  );
}

DocumentEditor.modules = {
  toolbar: [
    [{ 'font': [] }, { 'size': [] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike', { 'script': 'super' }, { 'script': 'sub' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

DocumentEditor.formats = [
  'font', 'size', 'header',
  'bold', 'italic', 'underline', 'strike', 'script',
  'color', 'background', 'align',
  'list', 'bullet', 'check', 'indent',
  'blockquote', 'code-block',
  'link', 'image', 'video',
];

export default DocumentEditor;
