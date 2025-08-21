import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";


import {
  Button,
  Typography,
  TextField,
  Modal,
  Box,
  List,
  ListItem,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import "./EditorPage.css";

function EditorPage() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [quillValue, setQuillValue] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({}); // Store remote cursors by user ID
  const [comments, setComments] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const quillRef = useRef();

  const getToken = () => localStorage.getItem("token") || "";

  const getUsername = () => {
  const token = getToken();
  if (!token) return "Unknown";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.name || "User";
  } catch {
    return "User";
  }
};

const getCurrentUserId = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
};

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
    console.error("❌ OpenRouter error:", err);
    setAiLoading(false);
    return inputText;
  }
};



const handleImproveGrammar = async () => {
  const plainText = quillRef.current.getEditor().getText();
  const improved = await fetchAIResult(
    plainText,
    "Fix grammar, punctuation, and fluency. Return only the corrected version without explanation:"

  );
  if (improved) setQuillValue(improved);
};

const handleEnhanceTone = async () => {
  const plainText = quillRef.current.getEditor().getText();
  const improved = await fetchAIResult(
    plainText,
    "Rewrite this text to make it more professional and engaging in tone:"
  );
  if (improved) setQuillValue(improved);
};

const handleExportToPDF = () => {
  const element = document.querySelector(".ql-editor");
  if (!element) return;

  import("html2pdf.js").then((html2pdf) => {
    html2pdf.default().from(element).save(`${title || "Document"}.pdf`);
  });
};



const handleExportToWord = async () => {
  const plainText = quillRef.current?.getEditor().getText();
  if (!plainText) return;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun(plainText)],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title || "Document"}.docx`);
};






  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (socket && documentId) {
      const username = getUsername();
      socket.emit("join-document", { documentId, username });
      socket.on("user-list", (users) => {
        setActiveUsers(users);
      });
    }
  }, [socket, documentId]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) setQuillValue(data.content);
        if (data?.comments) setComments(data.comments);
        if (data?.title) setTitle(data.title);
      });
  }, [documentId]);

  useEffect(() => {
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (delta) => quill.updateContents(delta);
    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket]);

  useEffect(() => {
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (delta, _, source) => {
      if (source === "user") {
        socket.emit("send-changes", { documentId, delta });
      }
    };
    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket]);

  // Cursor tracking: Emit local cursor position
  useEffect(() => {
    if (!socket || !quillRef.current) return;
    const quill = quillRef.current.getEditor();
    
    let lastCursorData = null;
    const handleSelectionChange = (range, oldRange, source) => {
      if (source === "user" && range) {
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
          socket.emit("cursor-change", cursorData);
          lastCursorData = cursorData;
        }
      }
    };
    
    quill.on("selection-change", handleSelectionChange);
    return () => quill.off("selection-change", handleSelectionChange);
  }, [socket, documentId]);

  // Cursor tracking: Listen for remote cursor updates
  useEffect(() => {
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
    
    socket.on("remote-cursor", handleRemoteCursor);
    return () => socket.off("remote-cursor", handleRemoteCursor);
  }, [socket]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const token = getToken();
      const autoTitle =
        title.trim() ||
        quillValue.replace(/<[^>]+>/g, "").slice(0, 30) ||
        "Untitled";
      fetch(`http://localhost:5000/api/document/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: quillValue, title: autoTitle }),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [quillValue, title, documentId]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const handleSelectionChange = (range) => {
      if (range && range.length > 0) {
        setSelectedRange(range);
        setShowCommentModal(true);
      }
    };
    quill.on("selection-change", handleSelectionChange);
    return () => quill.off("selection-change", handleSelectionChange);
  }, []);

  // Add real-time comment listener
  useEffect(() => {
    const socket = socket;
    if (!socket) return;

    const handleNewComment = (newComment) => {
      setComments(prev => [...prev, newComment]);
    };

    socket.on('new-comment', handleNewComment);
    return () => socket.off('new-comment', handleNewComment);
  }, [socket]);

  const handleCommentSubmit = async () => {
    const token = getToken();
    try {
      const res = await fetch(`http://localhost:5000/api/document/${documentId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText, position: selectedRange }),
      });
      if (res.ok) {
        // Don't add to local state here - it will come through real-time
        setNewCommentText("");
        setShowCommentModal(false);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleShare = async () => {
    const token = getToken();
    const res = await fetch(
      `http://localhost:5000/api/document/${documentId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      alert("✅ Document shared!");
      setShareEmail("");
      setShareRole("Viewer");
      setRoleModalOpen(false);
    } else {
      alert("❌ " + data.message);
    }
  };

  // Drag and drop handlers for image upload
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    try {
      setUploadStatus('uploading');
      
      for (const file of imageFiles) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.warn('File too large:', file.name);
          continue;
        }

        // Convert file to base64 for embedding
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target.result;
          
          // Get current cursor position
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection() || { index: quill?.getLength() || 0 };
          
          // Insert image at cursor position
          if (quill) {
            quill.insertEmbed(range.index, 'image', base64Data);
            quill.setSelection(range.index + 1);
            
            // Auto-save the document after image upload
            setTimeout(() => {
              const autoTitle = title.trim() || quillValue.replace(/<[^>]+>/g, "").slice(0, 30) || "Untitled";
              fetch(`http://localhost:5000/api/document/${documentId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ content: quillValue, title: autoTitle }),
              });
            }, 500);
          }
        };
        reader.readAsDataURL(file);
      }

      setUploadStatus('success');
      setTimeout(() => setUploadStatus(null), 3000);
      
      // Auto-save the document after all images are uploaded
      setTimeout(() => {
        const autoTitle = title.trim() || quillValue.replace(/<[^>]+>/g, "").slice(0, 30) || "Untitled";
        fetch(`http://localhost:5000/api/document/${documentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ content: quillValue, title: autoTitle }),
        });
      }, 1000);
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className="editor-root">
      <div className="editor-header-row">
        <Button
          variant="outlined"
          className="editor-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
        <TextField
          className="editor-title-input"
          label="Document Title"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
        />
        <div className="editor-header-actions">
          <Button
            variant="contained"
            className="editor-share-btn"
            onClick={() => setRoleModalOpen(true)}
          >
            Share
          </Button>
          <Button
            variant="contained"
            className="editor-export-btn"
            onClick={handleExportToPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>
      <div className="editor-main-box">
        <div className="editor-toolbar-row">
          <Button
            variant="contained"
            color="success"
            className="editor-save-btn"
            onClick={() => {
              const autoTitle =
                title.trim() ||
                quillValue.replace(/<[^>]+>/g, "").slice(0, 30) ||
                "Untitled";
              fetch(`http://localhost:5000/api/document/${documentId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ content: quillValue, title: autoTitle }),
              });
            }}
          >
            Save
          </Button>
          <Button variant="outlined" onClick={handleImproveGrammar} disabled={aiLoading} className="editor-ai-btn">
            Improve Grammar
          </Button>
          <Button
            variant="outlined"
            onClick={handleEnhanceTone}
            className="editor-ai-btn"
            disabled={aiLoading}
          >
            Enhance Tone
          </Button>
          {aiLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </div>
        <div className="editor-users-row">
          <Typography variant="subtitle1">Active Users:</Typography>
          <ul className="editor-users-list">
            {activeUsers.map((u, i) => (
              <li key={i} className="editor-user-item">{u}</li>
            ))}
          </ul>
        </div>
        
        {/* Drag and Drop Hint */}
        <Box sx={{ 
          mb: 2, 
          p: 1, 
          bgcolor: 'info.light', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: '0.8rem'
        }}>
          <Typography variant="caption" color="info.contrastText">
            💡 Tip: Drag and drop images directly into the editor to embed them
          </Typography>
        </Box>
        <div 
          className="editor-quill-box"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: isDragOver ? '2px dashed #ff6b6b' : 'none',
            backgroundColor: isDragOver ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={quillValue}
            onChange={setQuillValue}
            placeholder="Start writing your collaborative document here..."
          />
          
          {/* Drag Overlay */}
          {isDragOver && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 107, 107, 0.9)',
                zIndex: 1000,
                borderRadius: 1,
                border: '2px dashed #fff'
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  color: 'white',
                  p: 3
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Drop Images Here
                </Typography>
                <Typography variant="body2">
                  Drag and drop image files to embed them in the document
                </Typography>
              </Box>
            </Box>
          )}
        </div>
        <div className="editor-comments-section">
          <Typography variant="h6" className="editor-comments-title">Comments</Typography>
          <List className="editor-comments-list">
            {comments.map((c, i) => (
              <ListItem key={i} className="editor-comment-item">
                <strong>{c.author?.name || "User"}:</strong> {c.text}
              </ListItem>
            ))}
          </List>
        </div>
      </div>
      {/* Comment Modal */}
      <Modal open={showCommentModal} onClose={() => setShowCommentModal(false)}>
        <Box className="editor-modal-box">
          <Typography variant="h6" gutterBottom>Add Comment</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Type your comment"
          />
          <Button onClick={handleCommentSubmit} variant="contained" sx={{ mt: 2 }}>
            Submit
          </Button>
        </Box>
      </Modal>
      {/* Share Modal */}
      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <Box className="editor-modal-box">
          <Typography variant="h6" gutterBottom>Invite Collaborator</Typography>
          <TextField
            fullWidth
            label="Email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={shareRole}
              label="Role"
              onChange={(e) => setShareRole(e.target.value)}
            >
              <MenuItem value="Editor">Editor</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Modal>
      
      {/* Upload Status Notifications */}
      <Snackbar open={!!uploadStatus} autoHideDuration={3000} onClose={() => setUploadStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {uploadStatus === 'uploading' ? (
          <Alert severity="info" sx={{ width: '100%' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              Uploading images...
            </Box>
          </Alert>
        ) : uploadStatus === 'success' ? (
          <Alert severity="success" sx={{ width: '100%' }}>
            Images uploaded and document saved successfully!
          </Alert>
        ) : uploadStatus === 'error' ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            Failed to upload images. Please try again.
          </Alert>
        ) : null}
      </Snackbar>
    </div>
  );
}

export default EditorPage;

