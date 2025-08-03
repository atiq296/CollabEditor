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
  InputAdornment,
} from "@mui/material";
import {
  Email,
  ArrowBack,
  LockReset,
  Security,
  CheckCircle,
  Support,
} from "@mui/icons-material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Password reset link sent! Check your email.");
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="forgotpassword-root">
      {/* Enhanced Header */}
      <header className="forgotpassword-header">
        <div className="forgotpassword-header-content">
          <div className="forgotpassword-logo-section">
            <CollabEditorLogo size={120} className="forgotpassword-logo-icon" />
            <div className="forgotpassword-logo-text">
              <Typography variant="h4" className="forgotpassword-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="forgotpassword-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="forgotpassword-header-actions">
            <Button 
              variant="outlined" 
              className="forgotpassword-back-btn"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="forgotpassword-main">
        <div className="forgotpassword-content">
          <div className="forgotpassword-form-container">
            <Card className="forgotpassword-form-card">
              <CardContent className="forgotpassword-form-content">
                <div className="forgotpassword-form-header">
                  <div className="forgotpassword-icon-container">
                    <LockReset className="forgotpassword-icon" />
                  </div>
                  <Typography variant="h3" className="forgotpassword-form-title">
                    Reset Your Password
                  </Typography>
                  <Typography variant="body1" className="forgotpassword-form-subtitle">
                    Enter your email address and we'll send you a password reset link
      </Typography>
                </div>

                {status && (
                  <Alert severity="success" className="forgotpassword-success-alert">
                    {status}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" className="forgotpassword-error-alert">
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="forgotpassword-form">
        <TextField
                    label="Email Address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
                    className="forgotpassword-input"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email className="forgotpassword-input-icon" />
                        </InputAdornment>
                      ),
                    }}
                  />

        <Button
          type="submit"
          variant="contained"
          fullWidth
                    size="large"
                    className="forgotpassword-submit-btn"
        >
          Send Reset Link
        </Button>

                  <div className="forgotpassword-form-footer">
      <Button
        variant="text"
                      className="forgotpassword-login-btn"
        onClick={() => navigate("/login")}
      >
        Back to Login
      </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Security Info Section */}
          <div className="forgotpassword-security">
            <Typography variant="h4" className="forgotpassword-security-title">
              Secure Password Recovery
            </Typography>
            <div className="forgotpassword-security-grid">
              <div className="forgotpassword-security-item">
                <Security className="forgotpassword-security-icon" />
                <div className="forgotpassword-security-content">
                  <Typography variant="h6" className="forgotpassword-security-title">
                    Secure Process
                  </Typography>
                  <Typography variant="body2" className="forgotpassword-security-description">
                    Your email address is verified before sending any reset links to ensure account security.
                  </Typography>
                </div>
              </div>
              <div className="forgotpassword-security-item">
                <CheckCircle className="forgotpassword-security-icon" />
                <div className="forgotpassword-security-content">
                  <Typography variant="h6" className="forgotpassword-security-title">
                    Quick Recovery
                  </Typography>
                  <Typography variant="body2" className="forgotpassword-security-description">
                    Receive a secure reset link in your email within minutes to regain access to your account.
                  </Typography>
                </div>
              </div>
              <div className="forgotpassword-security-item">
                <Support className="forgotpassword-security-icon" />
                <div className="forgotpassword-security-content">
                  <Typography variant="h6" className="forgotpassword-security-title">
                    Need Help?
                  </Typography>
                  <Typography variant="body2" className="forgotpassword-security-description">
                    If you don't receive the email, check your spam folder or contact our support team.
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

export default ForgotPassword; 