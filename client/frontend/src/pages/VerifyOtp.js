import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Container, Alert } from "@mui/material";

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
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Verify Your Email
      </Typography>
      <Typography align="center" sx={{ mb: 2 }}>
        Enter the OTP sent to your email: <b>{email}</b>
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="OTP"
          type="text"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Verify OTP
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          sx={{ mt: 1 }}
          onClick={handleResend}
        >
          Resend OTP
        </Button>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>OTP verified! Redirecting to login...</Alert>}
        {resendStatus && <Alert severity="info" sx={{ mt: 2 }}>{resendStatus}</Alert>}
      </form>
    </Container>
  );
}

export default VerifyOtp; 