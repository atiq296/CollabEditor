import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DocumentViewer.css';
import { 
  Typography,
  Button,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  ArrowBack,
  Visibility,
  Edit,
  Description,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

function DocumentViewer() {
  const { id: documentId } = useParams();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Loading...');
  const [comments, setComments] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [documentRole, setDocumentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const quillRef = useRef(null);
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

  useEffect(() => {
    const token = getToken();
    
    // Fetch user profile
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setUserRole(data.role || 'Owner');
      })
      .catch(() => setUser(null));

    // Fetch document
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Document not found: The requested document does not exist.');
          } else if (res.status === 401) {
            throw new Error('Authentication failed: Please log in again.');
          } else {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        setContent(data.content || '');
        setTitle(data.title || 'Untitled Document');
        setComments(data.comments || []);
        setDocumentRole(data.userRole || 'Owner');
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
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

  // Calculate statistics
  const wordCount = content.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.replace(/<[^>]+>/g, '').length;
  const paragraphCount = content.split('<p>').length - 1;

  if (loading) {
    return (
      <div className="documentviewer-root">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={60} />
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="documentviewer-root">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            {error}
          </Alert>
          
          {/* Debug Information */}
          <Card sx={{ mb: 2, maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🔍 Debug Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Document ID:</strong> {documentId}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your Email:</strong> {user?.email || 'Not loaded'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your User ID:</strong> {getCurrentUserId() || 'Not available'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Your Role:</strong> {userRole || 'Not loaded'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Token Status:</strong> {getToken() ? 'Valid' : 'Missing'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                💡 <strong>Troubleshooting Tips:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                • Make sure you're logged in with the same email that was shared
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                • Check if you received an email with the sharing link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                • Try accessing the document from your dashboard instead
              </Typography>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Box>
        </Box>
      </div>
    );
  }

  return (
    <div className="documentviewer-root">
      {/* Header */}
      <header className="documentviewer-header">
        <div className="documentviewer-header-content">
          <div className="documentviewer-user-section">
            <div className="documentviewer-user-profile">
              <Avatar 
                className="documentviewer-user-avatar"
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
              <div className="documentviewer-user-details">
                <Typography variant="h6" className="documentviewer-user-name">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" className="documentviewer-user-email">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    icon={documentRole === 'Owner' ? <AdminPanelSettings /> : documentRole === 'Editor' ? <Edit /> : <Visibility />}
                    label={`${documentRole || 'Viewer'} (Document)`}
                    size="small"
                    className="documentviewer-user-role"
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
          
          <div className="documentviewer-stats-section">
            <Grid container spacing={2} className="documentviewer-stats-grid">
              <Grid item xs={6} sm={3}>
                <Card className="documentviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="documentviewer-stat-number">
                      {wordCount}
                    </Typography>
                    <Typography variant="body2" className="documentviewer-stat-label">
                      Words
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="documentviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="documentviewer-stat-number">
                      {charCount}
                    </Typography>
                    <Typography variant="body2" className="documentviewer-stat-label">
                      Characters
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="documentviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="documentviewer-stat-number">
                      {paragraphCount}
                    </Typography>
                    <Typography variant="body2" className="documentviewer-stat-label">
                      Paragraphs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="documentviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="documentviewer-stat-number">
                      {activeUsers.length}
                    </Typography>
                    <Typography variant="body2" className="documentviewer-stat-label">
                      Active Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>

          <div className="documentviewer-header-actions">
            <Button
              variant="outlined"
              color="primary"
              className="documentviewer-back-btn"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="documentviewer-main-box">
        <div className="documentviewer-title-section">
          <Typography variant="h3" className="documentviewer-title">
            {title}
          </Typography>
          <Box sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: 'info.light', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Visibility fontSize="small" />
            <Typography variant="body2">
              You are viewing this document in read-only mode.
            </Typography>
          </Box>
        </div>

        <div className="documentviewer-content">
          <div className="documentviewer-editor-container">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              readOnly={true}
              placeholder="Document content will appear here..."
              modules={{
                toolbar: false // Disable toolbar for read-only mode
              }}
              formats={[
                'header', 'bold', 'italic', 'underline', 'strike',
                'color', 'background', 'align', 'list', 'bullet',
                'blockquote', 'code-block', 'link', 'image'
              ]}
              className="documentviewer-quill"
            />
          </div>
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="documentviewer-comments-section">
            <Typography variant="h6" className="documentviewer-comments-title">
              💬 Comments ({comments.length})
            </Typography>
            <div className="documentviewer-comments-list">
              {comments.map((comment, index) => (
                <div key={index} className="documentviewer-comment-item">
                  <div className="documentviewer-comment-meta">
                    <span className="documentviewer-comment-author">
                      {comment.author && typeof comment.author === 'object' ? comment.author.name : comment.author}
                    </span>
                    {comment.date && <span className="documentviewer-comment-date">{comment.date}</span>}
                  </div>
                  <div className="documentviewer-comment-text">{comment.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default DocumentViewer; 