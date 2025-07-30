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
  Chip,
} from "@mui/material";
import {
  Email,
  ArrowBack,
  VerifiedUser,
  Security,
  CheckCircle,
  Support,
  Refresh,
} from "@mui/icons-material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./VerifyOtp.css";

function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        localStorage.removeItem("pendingEmail");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(data.message || "OTP verification failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const handleResend = async () => {
    setResendStatus("");
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus("OTP resent! Check your email.");
      } else {
        setResendStatus(data.message || "Failed to resend OTP");
      }
    } catch {
      setResendStatus("Server error");
    }
  };

  return (
    <div className="verifyotp-root">
      {/* Enhanced Header */}
      <header className="verifyotp-header">
        <div className="verifyotp-header-content">
          <div className="verifyotp-logo-section">
            <CollabEditorLogo size={120} className="verifyotp-logo-icon" />
            <div className="verifyotp-logo-text">
              <Typography variant="h4" className="verifyotp-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="verifyotp-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="verifyotp-header-actions">
            <Button 
              variant="outlined" 
              className="verifyotp-back-btn"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/signup")}
            >
              Back to Signup
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="verifyotp-main">
        <div className="verifyotp-content">
          <div className="verifyotp-form-container">
            <Card className="verifyotp-form-card">
              <CardContent className="verifyotp-form-content">
                <div className="verifyotp-form-header">
                  <div className="verifyotp-icon-container">
                    <VerifiedUser className="verifyotp-icon" />
                  </div>
                  <Typography variant="h3" className="verifyotp-form-title">
                    Verify Your Email
                  </Typography>
                  <Typography variant="body1" className="verifyotp-form-subtitle">
                    Enter the verification code sent to your email address
                  </Typography>
                  
                  <div className="verifyotp-email-display">
                    <Chip 
                      icon={<Email />}
                      label={email}
                      className="verifyotp-email-chip"
                      variant="outlined"
                    />
                  </div>
                </div>

                {error && (
                  <Alert severity="error" className="verifyotp-error-alert">
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" className="verifyotp-success-alert">
                    Email verified successfully! Redirecting to login...
                  </Alert>
                )}

                {resendStatus && (
                  <Alert severity="info" className="verifyotp-info-alert">
                    {resendStatus}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="verifyotp-form">
                  <TextField
                    label="Verification Code"
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                    className="verifyotp-input"
                    placeholder="Enter 6-digit code"
                    InputProps={{
                      style: { 
                        fontSize: '1.2rem',
                        letterSpacing: '0.5rem',
                        textAlign: 'center'
                      }
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    className="verifyotp-submit-btn"
                  >
                    Verify Email
                  </Button>

                  <div className="verifyotp-form-footer">
                    <Button
                      variant="outlined"
                      className="verifyotp-resend-btn"
                      startIcon={<Refresh />}
                      onClick={handleResend}
                    >
                      Resend Code
                    </Button>
                    
                    <Button
                      variant="text"
                      className="verifyotp-back-btn"
                      onClick={() => navigate("/signup")}
                    >
                      Back to Signup
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Verification Info Section */}
          <div className="verifyotp-info">
            <Typography variant="h4" className="verifyotp-info-title">
              Email Verification Process
            </Typography>
            <div className="verifyotp-info-grid">
              <div className="verifyotp-info-item">
                <Security className="verifyotp-info-icon" />
                <div className="verifyotp-info-content">
                  <Typography variant="h6" className="verifyotp-info-title">
                    Secure Verification
                  </Typography>
                  <Typography variant="body2" className="verifyotp-info-description">
                    Your email is verified through a secure 6-digit code to ensure account authenticity.
                  </Typography>
                </div>
              </div>
              <div className="verifyotp-info-item">
                <CheckCircle className="verifyotp-info-icon" />
                <div className="verifyotp-info-content">
                  <Typography variant="h6" className="verifyotp-info-title">
                    Quick Process
                  </Typography>
                  <Typography variant="body2" className="verifyotp-info-description">
                    Enter the code from your email to complete registration and access your account.
                  </Typography>
                </div>
              </div>
              <div className="verifyotp-info-item">
                <Support className="verifyotp-info-icon" />
                <div className="verifyotp-info-content">
                  <Typography variant="h6" className="verifyotp-info-title">
                    Need Help?
                  </Typography>
                  <Typography variant="body2" className="verifyotp-info-description">
                    Check your spam folder or click "Resend Code" if you haven't received the email.
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

export default VerifyOtp; 