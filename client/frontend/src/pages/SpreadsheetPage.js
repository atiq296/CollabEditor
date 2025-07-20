import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Snackbar,
  Select,
  MenuItem,
} from "@mui/material";
import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "handsontable/dist/handsontable.full.min.css";
import "./SpreadsheetPage.css";
import { HyperFormula } from "hyperformula";

registerAllModules();

function SpreadsheetPage() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const importInputRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [title, setTitle] = useState('Untitled Spreadsheet');
  const [collaborators, setCollaborators] = useState([]);
  const [ownerId, setOwnerId] = useState(null);

  const getToken = () => localStorage.getItem("token") || "";
  const getUserId = () => {
    try {
      return JSON.parse(atob(getToken().split(".")[1])).id;
    } catch {
      return "";
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

  const handleRoleChange = async (userId, newRole) => {
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
    const userId = getUserId();

    fetch(`http://localhost:5000/api/document/${documentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((doc) => {
        setIsEditor(
          doc.createdBy === userId ||
            doc.collaborators?.some(
              (c) => c.user._id === userId && c.role === "Editor"
            )
        );
        setTitle(doc.title || 'Untitled Spreadsheet');
        setComments(doc.comments || []);
        setCollaborators(doc.collaborators || []);
        setOwnerId(doc.createdBy || (doc.createdBy?._id));
      });

    fetch(`http://localhost:5000/api/document/${documentId}/spreadsheet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((fetchedData) => {
        if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
          const rows = 20,
            cols = 10;
          const empty = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => "")
          );
          setData(empty);
        } else {
          setData(fetchedData);
        }
        setLoading(false);
      });
  }, [documentId]);

  useEffect(() => {
    if (!isEditor) return;
    const interval = setInterval(() => {
      fetch(`http://localhost:5000/api/document/${documentId}/spreadsheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ data }),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [data, documentId, isEditor]);

  const handleExportToExcel = () => {
    if (!data || data.length === 0) return;
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    saveAs(fileData, `spreadsheet_${documentId}.xlsx`);
  };

  // Import logic
  const handleImportClick = () => {
    if (importInputRef.current) importInputRef.current.value = null;
    importInputRef.current?.click();
  };
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      setData(rows);
    };
    reader.readAsArrayBuffer(file);
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
          body: JSON.stringify({ text: newComment }),
        });
        if (res.ok) {
          const savedComment = await res.json();
          setComments([...comments, savedComment]);
          setNewComment("");
        } else {
          alert("Failed to save comment.");
        }
      } catch (err) {
        alert("Server error while saving comment.");
      }
    }
  };

  const handleSave = async () => {
    console.log('Saving spreadsheet:', data, title);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/document/${documentId}/spreadsheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data, title }),
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

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box className="spreadsheet-root">
      <div className="spreadsheet-header-row">
        <Button
          variant="outlined"
          color="primary"
          className="spreadsheet-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
        <input
          className="spreadsheet-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            fontWeight: 800,
            fontSize: '1.5rem',
            textAlign: 'center',
            border: 'none',
            background: 'transparent',
            color: '#274690',
            outline: 'none',
            width: '100%',
            maxWidth: 400,
          }}
        />
        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <Button
            variant="outlined"
            color="primary"
            className="spreadsheet-import-btn"
            onClick={handleImportClick}
          >
            Import
          </Button>
          <input
            type="file"
            accept=".xlsx,.csv"
            ref={importInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <Button
            variant="contained"
            color="success"
            className="spreadsheet-export-btn"
            onClick={handleExportToExcel}
          >
            Export to Excel
          </Button>
          <Button
            variant="contained"
            color="success"
            className="spreadsheet-save-btn"
            onClick={handleSave}
          >
            Save Spreadsheet
          </Button>
        </div>
      </div>
      {!isEditor && (
        <Alert severity="info" sx={{ mb: 2 }}>
          View-only access. You cannot edit this spreadsheet.
        </Alert>
      )}
      <HotTable
        data={data}
        colHeaders
        rowHeaders
        readOnly={!isEditor}
        width="100%"
        height="75vh"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={true}
        dropdownMenu={true}
        mergeCells={true}
        filters={true}
        manualRowResize={true}
        manualColumnResize={true}
        autoWrapRow={true}
        autoWrapCol={true}
        undo={true}
        redo={true}
        copyPaste={true}
        comments={true}
        formulas={{
          engine: HyperFormula,
        }}
        fixedRowsTop={1}
        fixedColumnsLeft={1}
        afterChange={(changes) => {
          if (changes) {
            setData((prev) => [...prev]);
          }
        }}
        className="spreadsheet-table"
      />
      <div className="spreadsheet-comments-list" style={{marginTop: 24, marginBottom: 24}}>
        <Typography variant="h6">Comments</Typography>
        {comments.length === 0 && <div>No comments yet.</div>}
        {comments.map((c, i) => (
          <div key={i} className="spreadsheet-comment-item">
            <span className="spreadsheet-comment-author">
              {c.author && typeof c.author === 'object' ? c.author.name : c.author}
            </span>
            : {c.text}
          </div>
        ))}
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          style={{width: '100%', borderRadius: 8, border: '1px solid #b3c7f9', padding: '0.5rem 1rem', fontSize: '1rem', marginTop: 8}}
        />
        <Button onClick={handleAddComment} variant="contained" sx={{mt: 1}}>Add Comment</Button>
      </div>
      <div style={{ margin: '2rem 0' }}>
        <h3>Collaborators</h3>
        {collaborators.length === 0 && <div>No collaborators yet.</div>}
        {collaborators.map((collab) => (
          <div key={collab.user._id || collab.user} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span>{collab.user.name || collab.user.email || collab.user}</span>
            <b style={{ marginLeft: 8 }}>{collab.role}</b>
            {getCurrentUserId() === (ownerId?._id || ownerId) && (
              <Select
                value={collab.role}
                onChange={e => handleRoleChange(collab.user._id || collab.user, e.target.value)}
                size="small"
                sx={{ ml: 1 }}
              >
                <MenuItem value="Editor">Editor</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </Select>
            )}
          </div>
        ))}
      </div>
      <Snackbar open={!!saveStatus} autoHideDuration={2000} onClose={() => setSaveStatus(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {saveStatus === 'success' ? (
          <Alert severity="success" sx={{ width: '100%' }}>
            Spreadsheet saved successfully!
          </Alert>
        ) : saveStatus === 'error' ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            Failed to save spreadsheet.
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}

export default SpreadsheetPage;
