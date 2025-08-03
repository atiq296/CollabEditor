import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import './SpreadsheetViewer.css';
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
  TableChart,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

// Register all Handsontable modules
registerAllModules();

function SpreadsheetViewer() {
  const { id: spreadsheetId } = useParams();
  const [data, setData] = useState([]);
  const [title, setTitle] = useState('Loading...');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [documentRole, setDocumentRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hotTableRef = useRef(null);
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

  // Permission checks
  const isOwner = () => userRole === 'Owner' || documentRole === 'Owner';
  const isEditor = () => userRole === 'Editor' || documentRole === 'Editor';
  const isViewer = () => userRole === 'Viewer' || documentRole === 'Viewer';
  const canEdit = () => isOwner() || isEditor();

  const debugDocumentAccess = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('🔍 Document access debug response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('📄 Document details:', {
          id: data._id,
          title: data.title,
          createdBy: data.createdBy,
          collaborators: data.collaborators?.map(c => ({
            userId: c.user._id,
            userName: c.user.name,
            userEmail: c.user.email,
            role: c.role
          })) || [],
          currentUserId: getCurrentUserId(),
          currentUserEmail: user?.email
        });
      } else {
        const errorData = await res.json();
        console.log('❌ Document access error:', errorData);
      }
    } catch (err) {
      console.error('❌ Document access debug error:', err);
    }
  };

  useEffect(() => {
    const token = getToken();
    
    // Debug authentication
    console.log('SpreadsheetViewer Debug:', {
      spreadsheetId,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      currentUserId: getCurrentUserId()
    });
    
    // Fetch user profile
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error('User profile fetch failed:', res.status, res.statusText);
          throw new Error('Failed to fetch user profile');
        }
        return res.json();
      })
      .then(data => {
        console.log('User profile loaded:', {
          userId: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        });
        setUser(data);
        setUserRole(data.role || 'Owner');
      })
      .catch((error) => {
        console.error('User profile error:', error);
        setUser(null);
      });

    // Fetch spreadsheet
    console.log('Fetching spreadsheet:', spreadsheetId);
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/document/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Access denied: You do not have permission to view this spreadsheet. Please check if it was shared with your account.');
          } else if (res.status === 404) {
            throw new Error('Spreadsheet not found: The requested spreadsheet does not exist.');
          } else if (res.status === 401) {
            throw new Error('Authentication failed: Please log in again.');
          } else {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
        }
        return res.json();
      })
      .then((data) => {
        console.log('Spreadsheet loaded successfully:', {
          id: data._id,
          title: data.title,
          hasSpreadsheet: !!data.spreadsheet,
          dataLength: data.spreadsheet?.data?.length || 0,
          createdBy: data.createdBy,
          collaborators: data.collaborators?.length || 0
        });
        
        if (data.spreadsheet && Array.isArray(data.spreadsheet.data)) {
          setData(data.spreadsheet.data);
        } else {
          setData([['']]); // Empty spreadsheet
        }
        
        setTitle(data.title || 'Untitled Spreadsheet');
        
        // Set document role based on user's relationship to this spreadsheet
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
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading spreadsheet:', error);
        setError(error.message);
        setLoading(false);
      });
  }, [spreadsheetId]);

  // Calculate statistics
  const rowCount = data.length;
  const colCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;
  const cellCount = data.reduce((total, row) => total + row.length, 0);
  const nonEmptyCells = data.reduce((total, row) => 
    total + row.filter(cell => cell !== null && cell !== undefined && cell !== '').length, 0
  );

  if (loading) {
    return (
      <div className="spreadsheetviewer-root">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={60} />
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spreadsheetviewer-root">
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
                <strong>Spreadsheet ID:</strong> {spreadsheetId}
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
                • Try accessing the spreadsheet from your dashboard instead
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
            <Button variant="outlined" color="secondary" onClick={debugDocumentAccess}>
              Debug Access
            </Button>
          </Box>
        </Box>
      </div>
    );
  }

  return (
    <div className="spreadsheetviewer-root">
      {/* Header */}
      <header className="spreadsheetviewer-header">
        <div className="spreadsheetviewer-header-content">
          <div className="spreadsheetviewer-user-section">
            <div className="spreadsheetviewer-user-profile">
              <Avatar 
                className="spreadsheetviewer-user-avatar"
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
              <div className="spreadsheetviewer-user-details">
                <Typography variant="h6" className="spreadsheetviewer-user-name">
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="body2" className="spreadsheetviewer-user-email">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    icon={documentRole === 'Owner' ? <AdminPanelSettings /> : documentRole === 'Editor' ? <Edit /> : <Visibility />}
                    label={`${documentRole || 'Viewer'} (Spreadsheet)`}
                    size="small"
                    className="spreadsheetviewer-user-role"
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
          
          <div className="spreadsheetviewer-stats-section">
            <Grid container spacing={2} className="spreadsheetviewer-stats-grid">
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheetviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheetviewer-stat-number">
                      {rowCount}
                    </Typography>
                    <Typography variant="body2" className="spreadsheetviewer-stat-label">
                      Rows
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheetviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheetviewer-stat-number">
                      {colCount}
                    </Typography>
                    <Typography variant="body2" className="spreadsheetviewer-stat-label">
                      Columns
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheetviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheetviewer-stat-number">
                      {cellCount}
                    </Typography>
                    <Typography variant="body2" className="spreadsheetviewer-stat-label">
                      Total Cells
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card className="spreadsheetviewer-stat-card">
                  <CardContent>
                    <Typography variant="h4" className="spreadsheetviewer-stat-number">
                      {nonEmptyCells}
                    </Typography>
                    <Typography variant="body2" className="spreadsheetviewer-stat-label">
                      Filled Cells
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </div>

          <div className="spreadsheetviewer-header-actions">
            <Button
              variant="outlined"
              color="primary"
              className="spreadsheetviewer-back-btn"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="spreadsheetviewer-main-box">
        <div className="spreadsheetviewer-title-section">
          <Typography variant="h3" className="spreadsheetviewer-title">
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
              You are viewing this spreadsheet in read-only mode. {canEdit() && 'Click "Edit Spreadsheet" to make changes.'}
            </Typography>
          </Box>
        </div>

        <div className="spreadsheetviewer-content">
          <div className="spreadsheetviewer-spreadsheet-container">
            <HotTable
              ref={hotTableRef}
              data={data}
              readOnly={true}
              licenseKey="non-commercial-and-evaluation"
              className="spreadsheetviewer-handsontable"
              height="auto"
              width="100%"
              rowHeaders={true}
              colHeaders={true}
              stretchH="all"
              autoWrapRow={true}
              autoWrapCol={true}
              contextMenu={false}
              manualRowResize={false}
              manualColumnResize={false}
              manualRowMove={false}
              manualColumnMove={false}
              columnSorting={false}
              filters={false}
              dropdownMenu={false}
              comments={false}
              customBorders={false}
              columnSummary={false}
              rowSummary={false}
              formulas={{
                engine: 'hyperformula',
                sheetName: 'Sheet1'
              }}
              cell={[
                {
                  row: 0,
                  col: 0,
                  className: 'htCenter'
                }
              ]}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default SpreadsheetViewer; 