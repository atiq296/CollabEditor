import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DocumentEditor.css';
import { CircularProgress, Menu, MenuItem, Snackbar, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
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
  const socketRef = useRef(null);
  const quillRef = useRef(null); // <-- Add this line
  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  // Import file input ref
  const importInputRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [commentStatus, setCommentStatus] = useState(null); // 'success' | 'error' | null

  // Get username from token (simulate for now)
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

  useEffect(() => {
    const socket = io('http://localhost:5000');
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
    fetch(`http://localhost:5000/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Loaded:', data.content, data.title);
        setContent(data.content || '');
        setTitle(data.title || 'Untitled Document');
        setComments(data.comments || []);
      });
  }, [documentId]);

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

  const handleChange = (value) => {
    setContent(value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleSave = async () => {
    console.log('Saving:', content, title);
    try {
      const token = getToken();
      const autoTitle =
        title.trim() ||
        (typeof content === 'string' ? content.replace(/<[^>]+>/g, "").slice(0, 30) : "") ||
        "Untitled";
      const res = await fetch(`http://localhost:5000/api/document/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, title: autoTitle }),
      });
      if (res.ok) {
        setSaveStatus('success');
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
    if (newComment.trim()) {
      const token = getToken();
      try {
        const res = await fetch(`http://localhost:5000/api/document/${documentId}/comment`, {
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

  return (
    <div className="doceditor-root">
      <header className="doceditor-header">
        <div className="doceditor-title-row">
          <input
            className="doceditor-title-input"
            value={title}
            onChange={handleTitleChange}
          />
          <div className="doceditor-header-actions">
            <button className="doceditor-btn" onClick={handleImportClick}>Import</button>
            <input
              type="file"
              accept=".docx,.html"
              ref={importInputRef}
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button className="doceditor-btn" onClick={handleExportClick}>Export</button>
            <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={handleExportClose}>
              <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
              <MenuItem onClick={handleExportWord}>Export as Word</MenuItem>
            </Menu>
            <button className="doceditor-btn" onClick={handleSave}>Save</button>
            <button className="doceditor-btn" onClick={() => setShowSidebar(s => !s)}>{showSidebar ? 'Hide' : 'Show'} Comments</button>
          </div>
        </div>
        <div className="doceditor-users">
          Active Users: {activeUsers.map((u, i) => <span key={i} className="doceditor-user">{u}</span>)}
        </div>
        <div className="doceditor-ai-row">
          <button className="doceditor-btn" onClick={handleImproveGrammar} disabled={aiLoading}>Improve Grammar</button>
          <button className="doceditor-btn" onClick={handleEnhanceTone} disabled={aiLoading}>Enhance Tone</button>
          {aiLoading && <CircularProgress size={20} sx={{ ml: 2, color: '#274690' }} />}
        </div>
      </header>
      <div className="doceditor-main-row">
        <div className="doceditor-editor-box">
          <ReactQuill
            ref={quillRef} // <-- Attach the ref here
            theme="snow"
            value={content}
            onChange={handleChange}
            placeholder="Start typing here..."
            modules={DocumentEditor.modules}
            formats={DocumentEditor.formats}
          />
        </div>
        {showSidebar && (
          <aside className="doceditor-sidebar">
            <h3>Comments</h3>
            <div className="doceditor-comments-list">
              {comments.length === 0 && <div className="doceditor-no-comments">No comments yet.</div>}
              {comments.map((c, i) => (
                <div key={i} className="doceditor-comment-item">
                  <div className="doceditor-comment-meta">
                    <span className="doceditor-comment-author">
                      {c.author && typeof c.author === 'object' ? c.author.name : c.author}
                    </span>
                    {c.date && <span className="doceditor-comment-date">{c.date}</span>}
                    <button className="doceditor-comment-delete" onClick={() => handleDeleteComment(i)}>Delete</button>
                  </div>
                  <div className="doceditor-comment-text">{c.text}</div>
                </div>
              ))}
            </div>
            <div className="doceditor-add-comment">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
              />
              <button className="doceditor-btn" onClick={handleAddComment}>Add Comment</button>
            </div>
          </aside>
        )}
      </div>
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
