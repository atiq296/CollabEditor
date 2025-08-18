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
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import {
  Person,
  AdminPanelSettings,
  ArrowBack,
  FileUpload,
  FileDownload,
  Save,
  Share,
  Settings,
  TableChart,
  Description,
} from "@mui/icons-material";
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
  const [saveStatus, setSaveStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [title, setTitle] = useState('Untitled Spreadsheet');
  const [collaborators, setCollaborators] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [user, setUser] = useState(null);
  const [columnHeaders, setColumnHeaders] = useState({});
  const [rowHeaders, setRowHeaders] = useState({});
  const hotTableRef = useRef(null);

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

  // Function to expand data array with new rows and columns
  const expandData = (currentData, newRows = 0, newCols = 0) => {
    const currentRows = currentData.length;
    const currentCols = currentData[0] ? currentData[0].length : 0;
    
    let expandedData = [...currentData];
    
    // Add new rows if needed
    if (newRows > 0) {
      for (let i = 0; i < newRows; i++) {
        const newRow = Array.from({ length: currentCols + newCols }, () => "");
        expandedData.push(newRow);
      }
    }
    
    // Add new columns if needed
    if (newCols > 0) {
      expandedData = expandedData.map(row => {
        const newColsArray = Array.from({ length: newCols }, () => "");
        return [...row, ...newColsArray];
      });
    }
    
    return expandedData;
  };

  // Function to check if expansion is needed
  const checkAndExpand = (row, col, value) => {
    if (!value || value === "") return;
    
    const currentData = [...data];
    const currentRows = currentData.length;
    const currentCols = currentData[0] ? currentData[0].length : 0;
    
    let needsExpansion = false;
    let newRows = 0;
    let newCols = 0;
    
    // Check if we need to add rows (if data is entered in the last few rows)
    if (row >= currentRows - 3) {
      newRows = Math.max(10, Math.ceil((row + 5 - currentRows) / 10) * 10);
      needsExpansion = true;
    }
    
    // Check if we need to add columns (if data is entered in the last few columns)
    if (col >= currentCols - 3) {
      newCols = Math.max(5, Math.ceil((col + 3 - currentCols) / 5) * 5);
      needsExpansion = true;
    }
    
    if (needsExpansion) {
      const expandedData = expandData(currentData, newRows, newCols);
      setData(expandedData);
      
      // Update the Handsontable instance to reflect the new dimensions
      if (hotTableRef.current && hotTableRef.current.hotInstance) {
        const hot = hotTableRef.current.hotInstance;
        hot.loadData(expandedData);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const token = getToken();
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/collaborator`, {
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

    // Fetch user profile
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => setUser(null));

    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}`, {
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
        
        console.log('🔐 Spreadsheet access check:', {
          documentId: documentId,
          userId: userId,
          isOwner: doc.createdBy === userId,
          isEditor: doc.collaborators?.some(c => c.user._id === userId && c.role === "Editor"),
          isViewer: doc.collaborators?.some(c => c.user._id === userId && c.role === "Viewer"),
          collaborators: doc.collaborators?.map(c => ({
            userId: c.user._id,
            userName: c.user.name,
            userEmail: c.user.email,
            role: c.role
          })) || [],
          finalIsEditor: doc.createdBy === userId || doc.collaborators?.some(c => c.user._id === userId && c.role === "Editor")
        });
        
        setTitle(doc.title || 'Untitled Spreadsheet');
        setComments(doc.comments || []);
        setCollaborators(doc.collaborators || []);
        setOwnerId(doc.createdBy || (doc.createdBy?._id));
      });

    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/spreadsheet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log('Spreadsheet fetch response:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
        
        if (!res.ok) {
          return res.json().then(errorData => {
            console.error('Spreadsheet fetch error response:', errorData);
            throw new Error(`HTTP ${res.status}: ${errorData.message || res.statusText}`);
          });
        }
        return res.json();
      })
      .then((fetchedData) => {
        console.log('Spreadsheet data loaded:', {
          isArray: Array.isArray(fetchedData),
          length: fetchedData?.length || 0,
          hasData: fetchedData && fetchedData.length > 0,
          firstRow: fetchedData?.[0],
          sampleData: fetchedData?.slice(0, 3)
        });
        
        // Handle new response format with headers
        let spreadsheetData = fetchedData;
        let headers = {};
        
        if (fetchedData && typeof fetchedData === 'object' && fetchedData.data) {
          // New format with headers
          spreadsheetData = fetchedData.data;
          headers = {
            columnHeaders: fetchedData.columnHeaders || {},
            rowHeaders: fetchedData.rowHeaders || {}
          };
        }
        
        if (!Array.isArray(spreadsheetData) || spreadsheetData.length === 0) {
          console.log('Creating empty spreadsheet with default size');
          const rows = 30, // Increased initial size
            cols = 15;     // Increased initial size
          const empty = Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => "")
          );
          setData(empty);
        } else {
          console.log('Setting spreadsheet data from server');
          setData(spreadsheetData);
        }
        
        // Load custom headers if available
        if (headers.columnHeaders) {
          setColumnHeaders(headers.columnHeaders);
        }
        if (headers.rowHeaders) {
          setRowHeaders(headers.rowHeaders);
        }
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading spreadsheet data:', error);
        setLoading(false);
        // Create empty spreadsheet on error
        const rows = 30, cols = 15;
        const empty = Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => "")
        );
        setData(empty);
      });
  }, [documentId]);

  useEffect(() => {
    if (!isEditor) return;
    const interval = setInterval(() => {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/spreadsheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ 
          data,
          columnHeaders,
          rowHeaders
        }),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [data, columnHeaders, rowHeaders, documentId, isEditor]);

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

  const handleEditHeaders = () => {
    const hot = hotTableRef.current.hotInstance;
    if (!hot) return;

    const headerType = prompt(
      'Choose what to edit:\n\n' +
      '1. Column Headers (A, B, C...)\n' +
      '2. Row Headers (1, 2, 3...)\n' +
      '3. Both\n\n' +
      'Enter 1, 2, or 3:'
    );

    if (headerType === '1') {
      // Edit column headers
      const colIndex = prompt(
        'Enter column number to edit (1, 2, 3...):\n\n' +
        'Current column headers:\n' +
        Object.entries(columnHeaders).map(([index, name]) => 
          `Column ${parseInt(index) + 1}: ${name || (parseInt(index) + 1)}`
        ).join('\n')
      );
      if (colIndex && !isNaN(colIndex)) {
        const index = parseInt(colIndex) - 1;
        const currentName = columnHeaders[index] || (index + 1);
        const newName = prompt(`Enter new name for Column ${colIndex} (current: "${currentName}"):`);
        if (newName !== null) {
          setColumnHeaders(prev => ({
            ...prev,
            [index]: newName.trim() || null
          }));
        }
      }
    } else if (headerType === '2') {
      // Edit row headers
      const rowIndex = prompt(
        'Enter row number to edit (1, 2, 3...):\n\n' +
        'Current row headers:\n' +
        Object.entries(rowHeaders).map(([index, name]) => 
          `Row ${parseInt(index) + 1}: ${name || (parseInt(index) + 1)}`
        ).join('\n')
      );
      if (rowIndex && !isNaN(rowIndex)) {
        const index = parseInt(rowIndex) - 1;
        const currentName = rowHeaders[index] || (index + 1);
        const newName = prompt(`Enter new name for Row ${rowIndex} (current: "${currentName}"):`);
        if (newName !== null) {
          setRowHeaders(prev => ({
            ...prev,
            [index]: newName.trim() || null
          }));
        }
      }
    } else if (headerType === '3') {
      // Edit both - show a summary
      alert(
        'Header Editing Options:\n\n' +
        '• Right-click on any cell and select "Edit Headers"\n' +
        '• Double-click directly on column or row headers\n' +
        '• Use this button to edit specific headers\n\n' +
        'Current custom headers:\n' +
        'Columns: ' + Object.keys(columnHeaders).length + ' custom\n' +
        'Rows: ' + Object.keys(rowHeaders).length + ' custom'
      );
    }
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
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/comment`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${documentId}/spreadsheet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          data, 
          title,
          columnHeaders,
          rowHeaders
        }),
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

  // Calculate statistics
  const totalRows = data.length;
  const totalCols = data[0] ? data[0].length : 0;
  const filledCells = data.reduce((count, row) => 
    count + row.filter(cell => cell && cell.toString().trim() !== '').length, 0
  );
  const totalCells = totalRows * totalCols;
  const fillPercentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <div className="spreadsheet-root">
      {/* Enhanced Header with User Info */}
      <header className="spreadsheet-header">
        <div className="spreadsheet-header-content">
          <div className="spreadsheet-user-section">
            <div className="spreadsheet-user-profile">
              <Avatar 
                className="spreadsheet-user-avatar"
                sx={{ 
                  width: 56, 
                  height: 56, 
                  bgcolor: '#21c47b',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div className="spreadsheet-user-details">
                <Typography variant="h6" className="spreadsheet-user-name">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" className="spreadsheet-user-email">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Chip 
                  icon={<AdminPanelSettings />}
                  label={user?.role || 'User'}
                  size="small"
                  className="spreadsheet-user-role"
                  color={user?.role === 'admin' ? 'error' : 'primary'}
                />
              </div>
            </div>
          </div>
          
          <div className="spreadsheet-stats-section">
            <Grid container spacing={2} className="spreadsheet-stats-grid">
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheet-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheet-stat-number">
                      {totalRows}
                    </Typography>
                    <Typography variant="body2" className="spreadsheet-stat-label">
                      Total Rows
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheet-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheet-stat-number">
                      {totalCols}
                    </Typography>
                    <Typography variant="body2" className="spreadsheet-stat-label">
                      Total Columns
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheet-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheet-stat-number">
                      {filledCells}
                    </Typography>
                    <Typography variant="body2" className="spreadsheet-stat-label">
                      Filled Cells
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheet-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheet-stat-number">
                      {fillPercentage}%
                    </Typography>
                    <Typography variant="body2" className="spreadsheet-stat-label">
                      Fill Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>

          <div className="spreadsheet-header-actions">
            <Tooltip title="Settings">
              <IconButton className="spreadsheet-action-btn">
                <Settings />
              </IconButton>
            </Tooltip>
        <Button
          variant="outlined"
          color="primary"
          className="spreadsheet-back-btn"
          onClick={() => navigate("/dashboard")}
              startIcon={<ArrowBack />}
        >
              Back to Dashboard
        </Button>
          </div>
        </div>
      </header>

      <main className="spreadsheet-main-box">
        <div className="spreadsheet-title-section">
        <input
          className="spreadsheet-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
            placeholder="Enter spreadsheet title..."
          />
        </div>

        {!isEditor && (
          <Alert severity="info" className="spreadsheet-view-only-alert">
            View-only access. You cannot edit this spreadsheet.
          </Alert>
        )}

        <div className="spreadsheet-actions">
          <Button
            variant="outlined"
            color="primary"
            className="spreadsheet-action-button"
            onClick={handleImportClick}
            startIcon={<FileUpload />}
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
            className="spreadsheet-action-button"
            onClick={handleExportToExcel}
            startIcon={<FileDownload />}
          >
            Export to Excel
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="spreadsheet-action-button"
            onClick={handleEditHeaders}
            startIcon={<Settings />}
          >
            Edit Headers
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="spreadsheet-action-button"
            onClick={handleSave}
            startIcon={<Save />}
          >
            Save Spreadsheet
          </Button>
        </div>

        <div className="spreadsheet-table-container">
      <HotTable
            ref={hotTableRef}
        data={data}
        colHeaders={(index) => columnHeaders[index] || (index + 1)}
        rowHeaders={(index) => rowHeaders[index] || (index + 1)}
        readOnly={!isEditor}
        width="100%"
            height="70vh"
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
        contextMenu={{
          items: {
            'edit_headers': {
              name: 'Edit Headers',
              callback: function() {
                const hot = hotTableRef.current.hotInstance;
                if (hot) {
                  const selected = hot.getSelected();
                  if (selected && selected.length > 0) {
                    const [startRow, startCol, endRow, endCol] = selected[0];
                    
                    // Check if selection includes headers
                    if (startRow < 0 || startCol < 0) {
                      // Header is selected, allow editing
                      const row = startRow < 0 ? startRow : endRow;
                      const col = startCol < 0 ? startCol : endCol;
                      hot.selectCell(row, col);
                      hot.getActiveEditor().beginEditing();
                    } else {
                      // Show dialog to select which headers to edit
                      const headerType = prompt('Edit headers:\n1. Column Headers\n2. Row Headers\n3. Both\n\nEnter 1, 2, or 3:');
                      if (headerType === '1') {
                        // Edit column headers
                        const colIndex = prompt('Enter column number to edit (1, 2, 3...):');
                        if (colIndex && !isNaN(colIndex)) {
                          const index = parseInt(colIndex) - 1;
                          hot.selectCell(-1, index);
                          hot.getActiveEditor().beginEditing();
                        }
                      } else if (headerType === '2') {
                        // Edit row headers
                        const rowIndex = prompt('Enter row number to edit (1, 2, 3...):');
                        if (rowIndex && !isNaN(rowIndex)) {
                          const index = parseInt(rowIndex) - 1;
                          hot.selectCell(index, -1);
                          hot.getActiveEditor().beginEditing();
                        }
                      } else if (headerType === '3') {
                        // Edit both - start with column
                        const colIndex = prompt('Enter column number to edit (1, 2, 3...):');
                        if (colIndex && !isNaN(colIndex)) {
                          const index = parseInt(colIndex) - 1;
                          hot.selectCell(-1, index);
                          hot.getActiveEditor().beginEditing();
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }}
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
        afterOnCellMouseDown={(event, coords) => {
          // Allow editing headers when double-clicked
          if (coords.row < 0 || coords.col < 0) {
            event.stopImmediatePropagation();
            const hot = hotTableRef.current.hotInstance;
            if (hot) {
              hot.selectCell(coords.row, coords.col);
              hot.getActiveEditor().beginEditing();
            }
          }
        }}
        afterChange={(changes) => {
          if (changes) {
            changes.forEach(([row, prop, oldValue, newValue]) => {
              // Handle header changes
              if (row < 0) {
                // Column header changed
                setColumnHeaders(prev => ({
                  ...prev,
                  [prop]: newValue
                }));
              } else if (prop < 0) {
                // Row header changed
                setRowHeaders(prev => ({
                  ...prev,
                  [row]: newValue
                }));
              } else {
                // Regular cell change
                const newData = [...data];
                if (newData[row]) {
                  newData[row][prop] = newValue;
                  // Check if we need to expand the grid
                  if (isEditor) {
                    checkAndExpand(row, prop, newValue);
                  }
                }
                setData(newData);
              }
            });
          }
        }}
        className="spreadsheet-table"
      />
        </div>

        <div className="spreadsheet-bottom-section">
          <div className="spreadsheet-comments-section">
            <Typography variant="h6" className="spreadsheet-section-title">
              💬 Comments ({comments.length})
            </Typography>
            {comments.length === 0 && (
              <Typography variant="body2" className="spreadsheet-empty-text">
                No comments yet. Start the conversation!
              </Typography>
            )}
        {comments.map((c, i) => (
          <div key={i} className="spreadsheet-comment-item">
            <span className="spreadsheet-comment-author">
              {c.author && typeof c.author === 'object' ? c.author.name : c.author}
            </span>
            : {c.text}
          </div>
        ))}
            <div className="spreadsheet-comment-input">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
                className="spreadsheet-comment-textarea"
              />
              <Button 
                onClick={handleAddComment} 
                variant="contained" 
                className="spreadsheet-comment-btn"
                startIcon={<Share />}
              >
                Add Comment
              </Button>
            </div>
      </div>

          <div className="spreadsheet-collaborators-section">
            <Typography variant="h6" className="spreadsheet-section-title">
              👥 Collaborators ({collaborators.length})
            </Typography>
            {collaborators.length === 0 && (
              <Typography variant="body2" className="spreadsheet-empty-text">
                No collaborators yet.
              </Typography>
            )}
        {collaborators.map((collab) => (
              <div key={collab.user._id || collab.user} className="spreadsheet-collaborator-item">
                <div className="spreadsheet-collaborator-info">
                  <span className="spreadsheet-collaborator-name">
                    {collab.user.name || collab.user.email || collab.user}
                  </span>
                  <Chip 
                    label={collab.role}
                    size="small"
                    color={collab.role === 'Editor' ? 'primary' : 'default'}
                    className="spreadsheet-collaborator-role"
                  />
                </div>
            {getCurrentUserId() === (ownerId?._id || ownerId) && (
              <Select
                value={collab.role}
                onChange={e => handleRoleChange(collab.user._id || collab.user, e.target.value)}
                size="small"
                    className="spreadsheet-role-select"
              >
                <MenuItem value="Editor">Editor</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
              </Select>
            )}
          </div>
        ))}
      </div>
        </div>
      </main>

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
    </div>
  );
}

export default SpreadsheetPage;
