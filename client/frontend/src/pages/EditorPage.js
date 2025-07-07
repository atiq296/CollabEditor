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
  CircularProgress,
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
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleCommentSubmit = async () => {
    const token = getToken();
    await fetch(`http://localhost:5000/api/document/${documentId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: newCommentText, position: selectedRange }),
    });
    setComments((prev) => [
      ...prev,
      {
        text: newCommentText,
        author: { name: getUsername() },
        position: selectedRange,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewCommentText("");
    setShowCommentModal(false);
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

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h6">👥 Active Users:</Typography>
      <ul>
        {activeUsers.map((u, i) => (
          <li key={i}>✅ {u}</li>
        ))}
      </ul>

      <TextField
        fullWidth
        label="Document Title"
        variant="outlined"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ mr: 1 }}
          onClick={() => setRoleModalOpen(true)}
        >
          ➕ Share Document
        </Button>
        <Button
          variant="contained"
          color="success"
          sx={{ mr: 1 }}
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
          💾 Save Document
        </Button>
        <Button variant="outlined" onClick={handleImproveGrammar} disabled={aiLoading}>
          ✍️ Improve Grammar
        </Button>
        <Button
          variant="outlined"
          onClick={handleEnhanceTone}
          sx={{ ml: 1 }}
          disabled={aiLoading}
        >
          🎯 Enhance Tone
        </Button>
        {aiLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Box>

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

      {/* Comments List */}
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

