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
  Grid,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowBack,
  CheckCircle,
  Security,
  Group,
} from "@mui/icons-material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      {/* Enhanced Header */}
      <header className="signup-header">
        <div className="signup-header-content">
          <div className="signup-logo-section">
            <CollabEditorLogo size={120} className="signup-logo-icon" />
            <div className="signup-logo-text">
              <Typography variant="h4" className="signup-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="signup-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="signup-header-actions">
            <Button 
              variant="outlined" 
              className="signup-back-btn"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
      </div>
      </header>

      {/* Main Content */}
      <main className="signup-main">
        <div className="signup-content">
          <div className="signup-form-container">
            <Card className="signup-form-card">
              <CardContent className="signup-form-content">
                <div className="signup-form-header">
                  <Typography variant="h3" className="signup-form-title">
                    Join CollabEditor
                  </Typography>
                  <Typography variant="body1" className="signup-form-subtitle">
                    Create your account and start collaborating today
          </Typography>
                </div>

          {error && (
                  <Alert severity="error" className="signup-error-alert">
              {error}
                  </Alert>
          )}

                <form onSubmit={handleSubmit} className="signup-form">
          <TextField
                    label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="signup-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person className="signup-input-icon" />
                        </InputAdornment>
                      ),
                    }}
          />

          <TextField
                    label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="signup-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email className="signup-input-icon" />
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
            className="signup-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="signup-input-icon" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            className="signup-password-toggle"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
          />

          <TextField
            label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
            margin="normal"
            className="signup-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="signup-input-icon" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            className="signup-password-toggle"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                    className="signup-submit-btn"
          >
                    Create Account
          </Button>

                  <div className="signup-form-footer">
                    <div className="signup-login-section">
                      <Typography variant="body2" className="signup-login-text">
                        Already have an account?
                      </Typography>
          <Button
            variant="outlined"
                        className="signup-login-btn"
            onClick={() => navigate("/login")}
          >
                        Sign In
          </Button>
                    </div>
                  </div>
        </form>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="signup-benefits">
            <Typography variant="h4" className="signup-benefits-title">
              Start Your Collaborative Journey
            </Typography>
            <div className="signup-benefits-grid">
              <div className="signup-benefit-item">
                <CheckCircle className="signup-benefit-icon" />
                <div className="signup-benefit-content">
                  <Typography variant="h6" className="signup-benefit-title">
                    Free to Start
                  </Typography>
                  <Typography variant="body2" className="signup-benefit-description">
                    Create unlimited documents and spreadsheets with basic features
                  </Typography>
                </div>
              </div>
              <div className="signup-benefit-item">
                <Security className="signup-benefit-icon" />
                <div className="signup-benefit-content">
                  <Typography variant="h6" className="signup-benefit-title">
                    Secure & Private
                  </Typography>
                  <Typography variant="body2" className="signup-benefit-description">
                    Enterprise-grade security with end-to-end encryption
                  </Typography>
                </div>
              </div>
              <div className="signup-benefit-item">
                <Group className="signup-benefit-icon" />
                <div className="signup-benefit-content">
                  <Typography variant="h6" className="signup-benefit-title">
                    Team Collaboration
                  </Typography>
                  <Typography variant="body2" className="signup-benefit-description">
                    Invite team members and collaborate in real-time
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
