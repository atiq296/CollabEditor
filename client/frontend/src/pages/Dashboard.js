import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Container } from "@mui/material";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
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

      <br />

      <Button
        variant="contained"
        color="error"
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Log Out
      </Button>
    </Container>
  );
}

export default Dashboard;
