import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TextField, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ArrowBack,
} from "@mui/icons-material";
import "./Login.css";
import CollabEditorLogo from "./CollabEditorLogo";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Enhanced Header */}
      <header className="login-header">
        <div className="login-header-content">
          <div className="login-logo-section">
            <CollabEditorLogo size={120} className="login-logo-icon" />
            <div className="login-logo-text">
              <Typography variant="h4" className="login-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="login-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="login-header-actions">
            <Button 
              variant="outlined" 
              className="login-back-btn"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-content">
          <div className="login-form-container">
            <Card className="login-form-card">
              <CardContent className="login-form-content">
                <div className="login-form-header">
                  <Typography variant="h3" className="login-form-title">
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" className="login-form-subtitle">
                    Sign in to continue to your workspace
                  </Typography>
                </div>

                {error && (
                  <Alert severity="error" className="login-error-alert">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                  <TextField
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                    className="login-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email className="login-input-icon" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                    className="login-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="login-input-icon" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            className="login-password-toggle"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    className="login-submit-btn"
                  >
                    Sign In
                  </Button>

                  <div className="login-form-footer">
                    <Button
                      variant="text"
                      className="login-forgot-btn"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </Button>
                    
                    <div className="login-signup-section">
                      <Typography variant="body2" className="login-signup-text">
                        Don't have an account?
                      </Typography>
                      <Button
                        variant="outlined"
                        className="login-signup-btn"
                        onClick={() => navigate("/signup")}
                      >
                        Create Account
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="login-features">
            <Typography variant="h4" className="login-features-title">
              Why Choose CollabEditor?
            </Typography>
            <div className="login-features-grid">
              <div className="login-feature-item">
                <Typography variant="h6" className="login-feature-title">
                  Real-time Collaboration
                </Typography>
                <Typography variant="body2" className="login-feature-description">
                  Edit documents and spreadsheets simultaneously with your team
                </Typography>
              </div>
              <div className="login-feature-item">
                <Typography variant="h6" className="login-feature-title">
                  AI-Powered Writing
                </Typography>
                <Typography variant="body2" className="login-feature-description">
                  Get grammar suggestions and tone improvements as you write
                </Typography>
              </div>
              <div className="login-feature-item">
                <Typography variant="h6" className="login-feature-title">
                  Secure & Reliable
                </Typography>
                <Typography variant="body2" className="login-feature-description">
                  Enterprise-grade security with automatic saving and version control
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
