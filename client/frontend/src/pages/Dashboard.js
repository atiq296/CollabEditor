import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  Stack,
  Divider,
  Modal,
  Box,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  ListItemAvatar,
  ListItemButton,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Description,
  TableChart,
  Add,
  Share,
  Settings,
  Logout,
  Person,
  Email,
  AdminPanelSettings,
  Edit,
  Visibility,
  ContentCopy,
  Link as LinkIcon,
  BugReport,
  PersonSearch,
} from "@mui/icons-material";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [myDocs, setMyDocs] = useState([]);
  const [user, setUser] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [shareStatus, setShareStatus] = useState(null);
  const [shareMethod, setShareMethod] = useState("email"); // "email" or "link"
  const [friends, setFriends] = useState([]);
  const [showFriends, setShowFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendSearchTerm, setFriendSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      // Fetch user profile
      fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => setUser(null));

      const fetchDocs = () => {
      fetch("http://localhost:5000/api/document/mydocs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMyDocs(data);
          } else {
            console.error("⚠️ Unexpected response:", data);
            setMyDocs([]);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to load documents:", err);
          setMyDocs([]);
        });
      };
      fetchDocs();
      // Listen for spreadsheet save event
      const refreshHandler = () => fetchDocs();
      window.addEventListener('refreshDocs', refreshHandler);
      return () => window.removeEventListener('refreshDocs', refreshHandler);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCreateDoc = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/document/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Document " + Date.now() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyDocs((prev) => [data, ...prev]);
        navigate(`/editor/${data._id}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleCreateSpreadsheet = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/document/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Spreadsheet " + Date.now() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMyDocs((prev) => [data, ...prev]);
        navigate(`/spreadsheet/${data._id}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleShare = async () => {
    if (!shareEmail && !selectedFriend) return;
    
    const emailToShare = selectedFriend ? selectedFriend.email : shareEmail;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/document/${shareDocId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailToShare, role: shareRole }),
      });
      if (res.ok) {
        setShareStatus("success");
        setTimeout(() => handleCloseShare(), 1200);
      } else {
        const data = await res.json();
        setShareStatus("error");
        alert(data.message || "Failed to share document");
      }
    } catch (err) {
      setShareStatus("error");
      alert("Server error");
    }
  };

  const handleShareWithLink = () => {
    // Check if the current document is a spreadsheet
    const currentDoc = [...textDocs, ...spreadsheets].find(doc => doc._id === shareDocId);
    const isSpreadsheet = currentDoc?.spreadsheet && Array.isArray(currentDoc.spreadsheet.data) && currentDoc.spreadsheet.data.length > 0;
    
    let urlPath;
    if (isSpreadsheet) {
      // For spreadsheets, use viewer route for viewers, editor route for editors/owners
      urlPath = shareRole === 'Viewer' ? '/spreadsheet-viewer/' : '/spreadsheet/';
    } else {
      // For documents, use viewer route for viewers, editor route for editors/owners
      urlPath = shareRole === 'Viewer' ? '/viewer/' : '/editor/';
    }
    
    const url = `${window.location.origin}${urlPath}${shareDocId}`;
    
    navigator.clipboard.writeText(url);
    setShareStatus('link-copied');
    setTimeout(() => setShareStatus(null), 1200);
  };

  const fetchFriends = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/auth/friends", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  const debugAllUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/auth/debug/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log("🔍 All registered users:", data);
        alert(`Found ${data.length} registered users. Check browser console for details.`);
      }
    } catch (err) {
      console.error("Failed to fetch all users:", err);
    }
  };

  const checkUserExists = async (email) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/auth/debug/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          console.log("✅ User found:", user);
          alert(`User found: ${user.name} (${user.email}) - Role: ${user.role} - Verified: ${user.verified}`);
        } else {
          console.log("❌ User not found:", email);
          alert(`User not found: ${email}\n\nAvailable users:\n${data.map(u => `${u.name} (${u.email})`).join('\n')}`);
        }
      }
    } catch (err) {
      console.error("Failed to check user:", err);
    }
  };

  const handleOpenShare = (docId) => {
    setShareDocId(docId);
    setShareOpen(true);
    setShareEmail("");
    setShareRole("Viewer");
    setShareStatus(null);
    setShareMethod("email");
    setSelectedFriend(null);
    setShowFriends(false);
    setFriendSearchTerm(""); // Reset search term
    fetchFriends(); // Fetch friends when opening share modal
  };
  const handleCloseShare = () => {
    setShareOpen(false);
    setShareDocId(null);
  };

  // Split documents into textDocs and spreadsheets
  const spreadsheets = myDocs.filter(
    doc => doc.spreadsheet && Array.isArray(doc.spreadsheet.data) && doc.spreadsheet.data.length > 0
  );
  const textDocs = myDocs.filter(
    doc => !doc.spreadsheet || !Array.isArray(doc.spreadsheet.data) || doc.spreadsheet.data.length === 0
  );

  // Calculate statistics
  const totalDocs = myDocs.length;
  const totalTextDocs = textDocs.length;
  const totalSpreadsheets = spreadsheets.length;
  const recentDocs = myDocs.filter(doc => {
    const daysSinceUpdate = (Date.now() - new Date(doc.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate <= 7;
  }).length;

  return (
    <div className="dashboard-root">
      {/* Enhanced Header with User Info */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-user-section">
            <div className="dashboard-user-profile">
              <Avatar 
                className="dashboard-user-avatar"
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
              <div className="dashboard-user-details">
                <Typography variant="h6" className="dashboard-user-name">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" className="dashboard-user-email">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Chip 
                  icon={<AdminPanelSettings />}
                  label={user?.role || 'User'}
                  size="small"
                  className="dashboard-user-role"
                  color={user?.role === 'admin' ? 'error' : 'primary'}
                />
              </div>
            </div>
          </div>
          
          <div className="dashboard-stats-section">
            <Grid container spacing={2} className="dashboard-stats-grid">
              <Grid item xs={6} sm={3}>
                <Card className="dashboard-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="dashboard-stat-number">
                      {totalDocs}
                    </Typography>
                    <Typography variant="body2" className="dashboard-stat-label">
                      Total Documents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="dashboard-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="dashboard-stat-number">
                      {totalTextDocs}
                    </Typography>
                    <Typography variant="body2" className="dashboard-stat-label">
                      Text Documents
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="dashboard-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="dashboard-stat-number">
                      {totalSpreadsheets}
                    </Typography>
                    <Typography variant="body2" className="dashboard-stat-label">
                      Spreadsheets
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="dashboard-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="dashboard-stat-number">
                      {recentDocs}
                    </Typography>
                    <Typography variant="body2" className="dashboard-stat-label">
                      Recent (7 days)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>

          <div className="dashboard-header-actions">
        <Button
              variant="outlined"
              color="primary"
          className="dashboard-logout-btn"
          onClick={handleLogout}
              startIcon={<Logout />}
        >
              Logout
        </Button>
          </div>
        </div>
      </header>

      <main className="dashboard-main-box">
        <Typography variant="h4" className="dashboard-welcome" gutterBottom>
          Welcome to CollabEditor 👋
        </Typography>
        <Typography variant="body1" className="dashboard-subtext" gutterBottom>
          Create, collaborate, and manage your documents and spreadsheets
        </Typography>
        
        <div className="dashboard-actions">
          <Button
            variant="contained"
            color="primary"
            className="dashboard-create-btn"
            onClick={handleCreateDoc}
            startIcon={<Add />}
          >
            Create Document
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="dashboard-create-btn"
            onClick={handleCreateSpreadsheet}
            startIcon={<Add />}
          >
            Create Spreadsheet
          </Button>
        </div>

        <div className="dashboard-content-grid">
          <div className="dashboard-section">
            <Typography variant="h6" className="dashboard-docs-title">
              📄 Your Documents ({totalTextDocs})
        </Typography>
            {Array.isArray(textDocs) && textDocs.length > 0 ? (
          <List className="dashboard-doc-list">
                {textDocs.map((doc) => (
              <div key={doc._id} className="dashboard-doc-item">
                <ListItem>
                  <ListItemText
                    primary={doc.title}
                    secondary={new Date(doc.updatedAt).toLocaleString()}
                  />
                </ListItem>
                <Stack direction="row" spacing={2} className="dashboard-doc-actions">
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/editor/${doc._id}`}
                        startIcon={<Description />}
                  >
                        Open Editor
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                        color="info"
                        onClick={() => handleOpenShare(doc._id)}
                        startIcon={<Share />}
                  >
                        Share
                  </Button>
                </Stack>
                <Divider />
              </div>
            ))}
          </List>
        ) : (
          <Typography variant="body2" className="dashboard-empty-text">
            You haven't created any documents yet.
          </Typography>
        )}
          </div>
          
          <div className="dashboard-section">
            <Typography variant="h6" className="dashboard-docs-title">
              📊 Your Spreadsheets ({totalSpreadsheets})
            </Typography>
            {Array.isArray(spreadsheets) && spreadsheets.length > 0 ? (
              <List className="dashboard-doc-list">
                {spreadsheets.map((doc) => (
                  <div key={doc._id} className="dashboard-doc-item">
                    <ListItem>
                      <ListItemText
                        primary={doc.title}
                        secondary={new Date(doc.updatedAt).toLocaleString()}
                      />
                    </ListItem>
                    <Stack direction="row" spacing={2} className="dashboard-doc-actions">
                      <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to={`/spreadsheet/${doc._id}`}
                        startIcon={<TableChart />}
                      >
                        Open Spreadsheet
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        onClick={() => handleOpenShare(doc._id)}
                        startIcon={<Share />}
                      >
                        Share
                      </Button>
                    </Stack>
                    <Divider />
                  </div>
                ))}
              </List>
            ) : (
              <Typography variant="body2" className="dashboard-empty-text">
                You haven't created any spreadsheets yet.
              </Typography>
            )}
          </div>
        </div>
      </main>

      <Modal open={shareOpen} onClose={handleCloseShare}>
        <Box sx={{ 
          p: 3, 
          bgcolor: '#fff', 
          borderRadius: 2, 
          boxShadow: 3, 
          maxWidth: 500, 
          mx: 'auto', 
          mt: 8,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Share Document
          </Typography>

          {/* Share Method Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Choose sharing method:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant={shareMethod === "email" ? "contained" : "outlined"}
                onClick={() => setShareMethod("email")}
                startIcon={<Email />}
              >
                Share via Email
              </Button>
              <Button
                variant={shareMethod === "link" ? "contained" : "outlined"}
                onClick={() => setShareMethod("link")}
                startIcon={<LinkIcon />}
              >
                Share via Link
              </Button>
            </Stack>
          </Box>

          {shareMethod === "email" && (
            <>
              {/* Role Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Assign Role</InputLabel>
                <Select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  label="Assign Role"
                >
                  <MenuItem value="Viewer">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      Viewer (Read-only)
                    </Box>
                  </MenuItem>
                  <MenuItem value="Editor">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Edit fontSize="small" />
                      Editor (Can edit)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Friends Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Share with registered users ({friends.length} users):
                </Typography>
                
                {/* Search Box */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search users by name or email..."
                  value={friendSearchTerm}
                  onChange={(e) => setFriendSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                
                {friends.length > 0 ? (
                  <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                    {friends
                      .filter(friend => 
                        friend.name?.toLowerCase().includes(friendSearchTerm.toLowerCase()) ||
                        friend.email?.toLowerCase().includes(friendSearchTerm.toLowerCase())
                      )
                      .map((friend) => (
                      <ListItem key={friend._id} disablePadding>
                        <ListItemButton
                          selected={selectedFriend?._id === friend._id}
                          onClick={() => setSelectedFriend(friend)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#274690' }}>
                              {friend.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={friend.name || 'Unknown User'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {friend.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Joined: {new Date(friend.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                          {selectedFriend?._id === friend._id && (
                            <Chip label={shareRole} size="small" color="primary" />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No other users found. You can share by entering an email address below.
                  </Typography>
                )}
              </Box>

              {/* Email Input */}
              <Typography variant="subtitle1" gutterBottom>
                Or share with email address:
              </Typography>
          <TextField
            fullWidth
            label="User Email"
            value={shareEmail}
            onChange={e => setShareEmail(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Enter email address"
              />

              <Button 
                variant="contained" 
                onClick={handleShare} 
                fullWidth
                disabled={!shareEmail && !selectedFriend}
            sx={{ mb: 2 }}
              >
                Share Document
              </Button>
            </>
          )}

          {shareMethod === "link" && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Copy this link to share the document:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
                  value={`${window.location.origin}${shareDocId ? (() => {
                    // Check if the current document is a spreadsheet
                    const currentDoc = [...textDocs, ...spreadsheets].find(doc => doc._id === shareDocId);
                    const isSpreadsheet = currentDoc?.spreadsheet && Array.isArray(currentDoc.spreadsheet.data) && currentDoc.spreadsheet.data.length > 0;
                    
                    let urlPath;
                    if (isSpreadsheet) {
                      // For spreadsheets, use viewer route for viewers, editor route for editors/owners
                      return shareRole === 'Viewer' ? '/spreadsheet-viewer/' : '/spreadsheet/';
                    } else {
                      // For documents, use viewer route for viewers, editor route for editors/owners
                      return shareRole === 'Viewer' ? '/viewer/' : '/editor/';
                    }
                  })() + shareDocId : ''}`}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
              sx={{ mr: 1 }}
            />
                <Tooltip title="Copy link">
                  <IconButton onClick={handleShareWithLink}>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
          </Box>
              <Typography variant="caption" color="text.secondary">
                Anyone with this link can view the document. For editing permissions, use email sharing.
              </Typography>
            </>
          )}

          {/* Status Messages */}
          {shareStatus === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Document shared successfully!
            </Alert>
          )}
          {shareStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to share document.
            </Alert>
          )}
          {shareStatus === 'link-copied' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Link copied to clipboard!
            </Alert>
          )}
        </Box>
      </Modal>
    </div>
  );
}

export default Dashboard;
