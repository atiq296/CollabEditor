import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Container } from "@mui/material";
import "./Login.css";
import CollabEditorLogo from "./CollabEditorLogo";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Save token and user name
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.name);
        // Always redirect to /select-role after login
        navigate("/select-role");
      } else {
        setError(data.message || "Login failed");
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
      <Container maxWidth="xs" className="login-container">
        <form
          onSubmit={handleSubmit}
          className="login-form animate-fade-in"
        >
          <Typography variant="h5" align="center" gutterBottom className="login-title">
            Login to Your Account
          </Typography>

          {error && (
            <Typography color="error" variant="body2" align="center" className="login-error">
              {error}
            </Typography>
          )}

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
            InputProps={{
              className: "login-input-inner"
            }}
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
            InputProps={{
              className: "login-input-inner"
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="login-button"
            sx={{ mt: 2 }}
          >
            Log In
          </Button>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            className="signup-button"
            sx={{ mt: 2 }}
            onClick={() => navigate("/signup")}
          >
            New user? Sign Up
          </Button>
        </form>
      </Container>
    </div>
  );
}

export default Login;
