import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Person,
  Email,
  AdminPanelSettings,
  Description,
  TableChart,
  Logout,
  Settings,
  Share,
  Add,
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

  const handleOpenShare = (docId) => {
    setShareDocId(docId);
    setShareOpen(true);
    setShareEmail("");
    setShareRole("Viewer");
    setShareStatus(null);
  };
  const handleCloseShare = () => {
    setShareOpen(false);
    setShareDocId(null);
  };
  const handleShare = async () => {
    if (!shareEmail) return;
    const token = localStorage.getItem("token");
    try {
      // Always send a role (default to 'Viewer')
      const res = await fetch(`http://localhost:5000/api/document/${shareDocId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: shareEmail, role: 'Viewer' }),
      });
      if (res.ok) {
        setShareStatus("success");
        setTimeout(() => handleCloseShare(), 1200);
      } else {
        setShareStatus("error");
      }
    } catch {
      setShareStatus("error");
    }
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
            <Tooltip title="Settings">
              <IconButton className="dashboard-action-btn">
                <Settings />
              </IconButton>
            </Tooltip>
        <Button
          variant="contained"
          color="error"
          className="dashboard-logout-btn"
          onClick={handleLogout}
              startIcon={<Logout />}
        >
          Log Out
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
        <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, boxShadow: 3, maxWidth: 400, mx: 'auto', mt: 12 }}>
          <Typography variant="h6" gutterBottom>Share Document</Typography>
          <TextField
            fullWidth
            label="User Email"
            value={shareEmail}
            onChange={e => setShareEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleShare} fullWidth>Share</Button>
          {shareStatus === 'success' && <Alert severity="success" sx={{ mt: 2 }}>Shared successfully!</Alert>}
          {shareStatus === 'error' && <Alert severity="error" sx={{ mt: 2 }}>Failed to share.</Alert>}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Or share with a link:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TextField
              value={`${window.location.origin}${shareDocId ? (spreadsheets.some(doc => doc._id === shareDocId) ? '/spreadsheet/' : '/editor/') + shareDocId : ''}`}
              InputProps={{ readOnly: true }}
              fullWidth
              size="small"
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                const url = `${window.location.origin}${shareDocId ? (spreadsheets.some(doc => doc._id === shareDocId) ? '/spreadsheet/' : '/editor/') + shareDocId : ''}`;
                navigator.clipboard.writeText(url);
                setShareStatus('link-copied');
                setTimeout(() => setShareStatus(null), 1200);
              }}
            >
              Copy Link
            </Button>
          </Box>
          {shareStatus === 'link-copied' && <Alert severity="success" sx={{ mt: 1 }}>Link copied!</Alert>}
        </Box>
      </Modal>
    </div>
  );
}

export default Dashboard;
