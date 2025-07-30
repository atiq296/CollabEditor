import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Grid,
  Chip,
} from "@mui/material";
import {
  AdminPanelSettings,
  Edit,
  Visibility,
  ArrowBack,
  CheckCircle,
  Security,
  Group,
} from "@mui/icons-material";
import CollabEditorLogo from "./CollabEditorLogo";
import "./SelectRole.css";

const roleData = {
  Owner: {
    icon: AdminPanelSettings,
    title: "Owner",
    description: "Full control: manage, edit, share, and delete documents.",
    features: ["Create & Delete Documents", "Manage Permissions", "Share with Others", "Full Editing Rights"],
    color: "#00FFFF"
  },
  Editor: {
    icon: Edit,
    title: "Editor", 
    description: "Can edit content and add comments, but cannot delete or share.",
    features: ["Edit Documents", "Add Comments", "View Content", "Collaborate"],
    color: "#40E0D0"
  },
  Viewer: {
    icon: Visibility,
    title: "Viewer",
    description: "View only: can read but not edit or comment.",
    features: ["Read Documents", "View Comments", "Track Changes", "No Editing"],
    color: "#8000FF"
  }
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
    <div className="role-root">
      {/* Enhanced Header */}
      <header className="role-header">
        <div className="role-header-content">
          <div className="role-logo-section">
            <CollabEditorLogo size={120} className="role-logo-icon" />
            <div className="role-logo-text">
              <Typography variant="h4" className="role-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="role-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="role-header-actions">
            <Button 
              variant="outlined" 
              className="role-back-btn"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="role-main">
        <div className="role-content">
          <div className="role-form-container">
            <Card className="role-form-card">
              <CardContent className="role-form-content">
                <div className="role-form-header">
                  <Typography variant="h3" className="role-form-title">
                    Choose Your Role
                  </Typography>
                  <Typography variant="body1" className="role-form-subtitle">
                    Select the role that best fits your collaboration needs
                  </Typography>
                </div>

                {error && (
                  <Alert severity="error" className="role-error-alert">
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" className="role-success-alert">
                    Role set successfully! Redirecting to dashboard...
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="role-form">
                  <FormControl component="fieldset" fullWidth className="role-form-control">
                    <RadioGroup value={role} onChange={handleChange} className="role-radio-group">
                      {Object.entries(roleData).map(([roleKey, roleInfo]) => {
                        const IconComponent = roleInfo.icon;
                        return (
                          <Card 
                            key={roleKey} 
                            className={`role-option-card ${role === roleKey ? 'role-option-selected' : ''}`}
                            onClick={() => setRole(roleKey)}
                          >
                            <CardContent className="role-option-content">
                              <div className="role-option-header">
                                <div className="role-option-icon">
                                  <IconComponent style={{ color: roleInfo.color }} />
                                </div>
                                <div className="role-option-info">
                                  <Typography variant="h6" className="role-option-title">
                                    {roleInfo.title}
                                  </Typography>
                                  <Typography variant="body2" className="role-option-description">
                                    {roleInfo.description}
                                  </Typography>
                                </div>
                                <Radio 
                                  value={roleKey} 
                                  className="role-radio"
                                  checked={role === roleKey}
                                />
                              </div>
                              <div className="role-option-features">
                                {roleInfo.features.map((feature, index) => (
                                  <Chip 
                                    key={index}
                                    label={feature}
                                    size="small"
                                    className="role-feature-chip"
                                    style={{ backgroundColor: `${roleInfo.color}20`, color: roleInfo.color }}
                                  />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    className="role-submit-btn"
                    disabled={!role}
                  >
                    Confirm Role & Continue
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Role Benefits Section */}
          <div className="role-benefits">
            <Typography variant="h4" className="role-benefits-title">
              Why Choose Your Role Carefully?
            </Typography>
            <div className="role-benefits-grid">
              <div className="role-benefit-item">
                <Security className="role-benefit-icon" />
                <div className="role-benefit-content">
                  <Typography variant="h6" className="role-benefit-title">
                    Security & Control
                  </Typography>
                  <Typography variant="body2" className="role-benefit-description">
                    Each role has specific permissions to ensure data security and proper access control.
                  </Typography>
                </div>
              </div>
              <div className="role-benefit-item">
                <Group className="role-benefit-icon" />
                <div className="role-benefit-content">
                  <Typography variant="h6" className="role-benefit-title">
                    Team Collaboration
                  </Typography>
                  <Typography variant="body2" className="role-benefit-description">
                    Different roles enable effective teamwork with appropriate access levels for each member.
                  </Typography>
                </div>
              </div>
              <div className="role-benefit-item">
                <CheckCircle className="role-benefit-icon" />
                <div className="role-benefit-content">
                  <Typography variant="h6" className="role-benefit-title">
                    Flexible Management
                  </Typography>
                  <Typography variant="body2" className="role-benefit-description">
                    Roles can be changed later by document owners to adapt to evolving project needs.
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

export default SelectRole; 