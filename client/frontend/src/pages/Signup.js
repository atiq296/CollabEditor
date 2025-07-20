import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Container } from "@mui/material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("pendingEmail", formData.email);
        navigate("/verify-otp");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="signup-root">
      <div className="logo-svg-container">
        <CollabEditorLogo style={{ maxWidth: 340, width: "90%", display: "block", margin: "0 auto" }} />
      </div>
      <Container maxWidth="xs" className="signup-container">
        <form onSubmit={handleSubmit} className="signup-form animate-fade-in">
          <Typography variant="h5" align="center" gutterBottom className="signup-title">
            Create Your Account
          </Typography>
          {error && (
            <Typography color="error" variant="body2" align="center" className="signup-error">
              {error}
            </Typography>
          )}
          <TextField
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="signup-input"
            InputProps={{ className: "signup-input-inner" }}
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
            className="signup-input"
            InputProps={{ className: "signup-input-inner" }}
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
            className="signup-input"
            InputProps={{ className: "signup-input-inner" }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="signup-input"
            InputProps={{ className: "signup-input-inner" }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="signup-button"
            sx={{ mt: 2 }}
          >
            Sign Up
          </Button>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            className="login-button"
            sx={{ mt: 2 }}
            onClick={() => navigate("/login")}
          >
            Already have an account? Log In
          </Button>
        </form>
      </Container>
    </div>
  );
}

export default Signup;
