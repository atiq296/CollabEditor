import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, MenuItem, Select, InputLabel, FormControl, FormHelperText } from "@mui/material";
import { FaFacebookF, FaGoogle, FaLinkedinIn } from "react-icons/fa";
import "./Signup.css";
import CollabEditorLogo from "./CollabEditorLogo";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Editor"
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="signup-root-2panel">
      <div className="signup-panel signup-panel-left">
        <CollabEditorLogo style={{ maxWidth: 200, width: "80%", display: "block", margin: "0 auto 1.5rem auto" }} />
        <Typography variant="h5" align="center" gutterBottom className="login-title">
          Sign Up
        </Typography>
        {error && <Typography color="error" variant="body2" align="center" className="login-error">{error}</Typography>}
        <form onSubmit={handleSubmit} className="signup-form-2panel">
          <TextField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="login-input"
            InputProps={{ className: "login-input-inner" }}
          />
          <TextField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="login-input"
            InputProps={{ className: "login-input-inner" }}
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="login-input"
            InputProps={{ className: "login-input-inner" }}
          />
          <FormControl fullWidth margin="normal" className="login-input">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Role"
              className="login-input-inner"
            >
              <MenuItem value="Owner">Owner</MenuItem>
              <MenuItem value="Editor">Editor</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </Select>
            <FormHelperText>Choose your role</FormHelperText>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="login-button"
            sx={{ mt: 2 }}
          >
            Sign Up
          </Button>
        </form>
      </div>
      <div className="signup-panel signup-panel-right">
        <Typography variant="h5" className="welcome-title" align="center" gutterBottom>Welcome!</Typography>
        <Typography align="center" sx={{ color: '#fff', fontSize: '1.1rem', mb: 3 }}>
          Join CollabEditor and start collaborating in real time.<br />
          Create, edit, and share documents with your team instantly.
        </Typography>
        <div className="welcome-login-prompt">
          <Typography align="center" sx={{ color: '#fff', fontWeight: 500 }}>
            Already have an account?
            <Button variant="text" className="welcome-login-link" onClick={() => navigate("/login")}>Log In</Button>
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default Signup;
