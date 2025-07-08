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
} from "@mui/material";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [myDocs, setMyDocs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
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

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <div className="dashboard-title">Dashboard</div>
        <Button
          variant="contained"
          color="error"
          className="dashboard-logout-btn"
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </header>
      <main className="dashboard-main-box">
        <Typography variant="h4" className="dashboard-welcome" gutterBottom>
          Welcome to CollabEditor 👋
        </Typography>
        <Typography variant="body1" className="dashboard-subtext" gutterBottom>
          You are successfully logged in!
        </Typography>
        <div className="dashboard-actions">
          <Button
            variant="contained"
            color="primary"
            className="dashboard-create-btn"
            onClick={handleCreateDoc}
          >
            ➕ Create New Document
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="dashboard-create-btn"
            onClick={handleCreateSpreadsheet}
          >
            🧮 Create Spreadsheet
          </Button>
        </div>
        <Typography variant="h6" className="dashboard-docs-title" align="left">
          📄 Your Documents:
        </Typography>
        {Array.isArray(myDocs) && myDocs.length > 0 ? (
          <List className="dashboard-doc-list">
            {myDocs.map((doc) => (
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
                  >
                    ✍️ Open Editor
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    to={`/spreadsheet/${doc._id}`}
                  >
                    📊 Open Spreadsheet
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
      </main>
    </div>
  );
}

export default Dashboard;
