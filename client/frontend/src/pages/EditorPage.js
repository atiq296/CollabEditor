import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
} from "@mui/material";

function EditorPage() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quillValue, setQuillValue] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const quillRef = useRef();

  const getUsername = () => {
    const token = localStorage.getItem("token");
    if (!token) return "Unknown";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.name || "User";
    } catch {
      return "User";
    }
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
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) setQuillValue(data.content);
        if (data?.comments) setComments(data.comments);
        if (data?.title) setTitle(data.title);
      })
      .catch((err) => console.error("❌ Load failed:", err));
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const interval = setInterval(() => {
      if (quillValue) {
        const autoTitle = title.trim() || quillValue.replace(/<[^>]+>/g, "").slice(0, 30) || "Untitled";
        fetch(`http://localhost:5000/api/document/${documentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: quillValue, title: autoTitle }),
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [quillValue, documentId, title]);

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

  const handleCommentSubmit = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/document/${documentId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText, position: selectedRange }),
      });
      const data = await res.json();
      setComments((prev) => [...prev, {
        text: newCommentText,
        author: { name: getUsername() },
        position: selectedRange,
        createdAt: new Date().toISOString(),
      }]);
      setNewCommentText("");
      setShowCommentModal(false);
    } catch (err) {
      alert("❌ Failed to save comment");
    }
  };

  const handleShare = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/document/${documentId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Document shared!");
        setShareEmail("");
        setShareRole("Viewer");
        setRoleModalOpen(false);
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      alert("❌ Failed to share");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h6">👥 Active Users:</Typography>
      <ul>{activeUsers.map((u, i) => <li key={i}>✅ {u}</li>)}</ul>

      <TextField
        fullWidth
        label="Document Title"
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button variant="contained" color="primary" sx={{ mr: 2 }} onClick={() => setRoleModalOpen(true)}>
        ➕ Share Document
      </Button>

      <Button
        variant="contained"
        color="success"
        sx={{ my: 2 }}
        onClick={async () => {
          const token = localStorage.getItem("token");
          const autoTitle = title.trim() || quillValue.replace(/<[^>]+>/g, "").slice(0, 30) || "Untitled";
          const res = await fetch(`http://localhost:5000/api/document/${documentId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: quillValue, title: autoTitle }),
          });
          if (res.ok) alert("💾 Saved!");
        }}
      >
        💾 Save Document
      </Button>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={quillValue}
        onChange={setQuillValue}
        placeholder="Start writing your collaborative document here..."
      />

      {/* Comment Modal */}
      <Modal open={showCommentModal} onClose={() => setShowCommentModal(false)}>
        <Box sx={{ p: 3, backgroundColor: "white", mx: "auto", my: "20vh", width: 400, borderRadius: 2 }}>
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

      {/* Comments */}
      <Typography variant="h6" sx={{ mt: 4 }}>💬 Comments:</Typography>
      <List>
        {comments.map((c, i) => (
          <ListItem key={i}>
            <strong>{c.author?.name || "User"}:</strong> {c.text}
          </ListItem>
        ))}
      </List>

      {/* Share Modal */}
      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <Box sx={{ p: 3, backgroundColor: "white", mx: "auto", my: "20vh", width: 400, borderRadius: 2 }}>
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
          <Button variant="contained" onClick={handleShare}>Share</Button>
        </Box>
      </Modal>
    </div>
  );
}

export default EditorPage;
