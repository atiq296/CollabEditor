import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

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
          Authorization: `Bearer ${token}`, // ✅ Proper format
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMyDocs(data);
          } else {
            console.error("⚠️ Unexpected response:", data);
            setMyDocs([]); // fallback
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
          Authorization: `Bearer ${token}`, // ✅ Proper format
        },
        body: JSON.stringify({ title: "New Document " + Date.now() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMyDocs((prev) => [data, ...prev]); // update UI immediately
        navigate(`/editor/${data._id}`);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the Dashboard 👋
      </Typography>
      <Typography variant="body1" gutterBottom>
        You are successfully logged in!
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateDoc}
        sx={{ mt: 3, mb: 2 }}
      >
        ➕ Create New Document
      </Button>

      <Typography variant="h6" align="left" sx={{ mt: 4 }}>
        📄 Your Documents:
      </Typography>

      {Array.isArray(myDocs) && myDocs.length > 0 ? (
        <List>
          {myDocs.map((doc) => (
            <div key={doc._id}>
              <ListItem button component={Link} to={`/editor/${doc._id}`}>
                <ListItemText
                  primary={doc.title}
                  secondary={new Date(doc.updatedAt).toLocaleString()}
                />
              </ListItem>
              <Divider />
            </div>
          ))}
        </List>
      ) : (
        <Typography variant="body2" sx={{ mt: 2 }}>
          You haven’t created any documents yet.
        </Typography>
      )}

      <Button
        variant="contained"
        color="error"
        onClick={handleLogout}
        sx={{ mt: 4 }}
      >
        Log Out
      </Button>
    </Container>
  );
}

export default Dashboard;
