import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Box, Alert } from "@mui/material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./Login.css";

const roleDescriptions = {
  Owner: "Full control: manage, edit, share, and delete documents.",
  Editor: "Can edit content and add comments, but cannot delete or share.",
  Viewer: "View only: can read but not edit or comment."
};

function SelectRole() {
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setRole(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError("Please select a role.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/set-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to set role.");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="login-root">
      <div className="logo-svg-container">
        <CollabEditorLogo style={{ maxWidth: 340, width: "90%", display: "block", margin: "0 auto" }} />
      </div>
      <Box className="login-form animate-fade-in" maxWidth={400} mx="auto" p={3}>
        <Typography variant="h5" align="center" gutterBottom className="login-title">
          Select Your Role
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Choose one:</FormLabel>
            <RadioGroup value={role} onChange={handleChange}>
              {Object.entries(roleDescriptions).map(([roleName, desc]) => (
                <div key={roleName} style={{ marginBottom: 18 }}>
                  <FormControlLabel
                    value={roleName}
                    control={<Radio />}
                    label={<span style={{ fontWeight: 600 }}>{roleName}</span>}
                  />
                  <Typography variant="body2" color="textSecondary" style={{ marginLeft: 32, marginTop: -8 }}>
                    {desc}
                  </Typography>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>Role set! Redirecting...</Alert>}
          <Button type="submit" variant="contained" color="primary" fullWidth className="login-button" sx={{ mt: 3 }}>
            Confirm Role
          </Button>
        </form>
      </Box>
    </div>
  );
}

export default SelectRole; 