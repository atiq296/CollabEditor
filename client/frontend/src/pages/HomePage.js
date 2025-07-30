import React from "react";
import {
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Description,
  TableChart,
  Group,
  Security,
  Speed,
  CloudSync,
  Psychology,
  School,
  Business,
  Edit,
  Visibility,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import CollabEditorLogo from "./CollabEditorLogo";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage-root">
      {/* Enhanced Header */}
      <header className="homepage-header">
        <div className="homepage-header-content">
          <div className="homepage-logo-section">
            <CollabEditorLogo size={160} className="homepage-logo-icon" />
            <div className="homepage-logo-text">
              <Typography variant="h4" className="homepage-logo-title">
                COLLABEDITOR
              </Typography>
              <Typography variant="body2" className="homepage-logo-subtitle">
                Real-time Collaborative Editing Platform
              </Typography>
            </div>
          </div>
          <div className="homepage-header-actions">
            <Button
              variant="outlined"
              className="homepage-signup-btn"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </Button>
            <Button
              variant="contained"
              className="homepage-login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="homepage-main">
        {/* Hero Section */}
        <section className="homepage-hero">
          <div className="homepage-hero-content">
            <div className="homepage-hero-text">
              <Typography variant="h2" className="homepage-hero-title">
                Collaborate in Real-Time
              </Typography>
              <Typography variant="h5" className="homepage-hero-subtitle">
                Powerful document and spreadsheet editing with live collaboration
              </Typography>
              <Typography variant="body1" className="homepage-hero-description">
                Experience seamless real-time editing with advanced conflict resolution,
                AI-powered writing assistance, and enterprise-grade security.
              </Typography>
              <div className="homepage-hero-actions">
                <Button
                  variant="contained"
                  size="large"
                  className="homepage-cta-btn"
                  onClick={() => navigate("/signup")}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  className="homepage-demo-btn"
                  onClick={() => navigate("/login")}
                >
                  Try Demo
                </Button>
              </div>
            </div>
            <div className="homepage-hero-visual">
              <div className="homepage-hero-icons">
                <Card className="homepage-icon-card">
                  <CardContent>
                    <Description className="homepage-icon" />
                    <Typography variant="h6">Documents</Typography>
                  </CardContent>
                </Card>
                <Card className="homepage-icon-card">
                  <CardContent>
                    <TableChart className="homepage-icon" />
                    <Typography variant="h6">Spreadsheets</Typography>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="homepage-stats">
          <Grid container spacing={3} className="homepage-stats-grid">
            <Grid item xs={6} sm={3}>
              <Card className="homepage-stat-card">
                <CardContent>
                  <Typography variant="h3" className="homepage-stat-number">
                    10K+
                  </Typography>
                  <Typography variant="body2" className="homepage-stat-label">
                    Active Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card className="homepage-stat-card">
                <CardContent>
                  <Typography variant="h3" className="homepage-stat-number">
                    50K+
                  </Typography>
                  <Typography variant="body2" className="homepage-stat-label">
                    Documents Created
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card className="homepage-stat-card">
                <CardContent>
                  <Typography variant="h3" className="homepage-stat-number">
                    99.9%
                  </Typography>
                  <Typography variant="body2" className="homepage-stat-label">
                    Uptime
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card className="homepage-stat-card">
                <CardContent>
                  <Typography variant="h3" className="homepage-stat-number">
                    24/7
                  </Typography>
                  <Typography variant="body2" className="homepage-stat-label">
                    Support
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </section>

        {/* Features Section */}
        <section className="homepage-features">
          <Typography variant="h3" className="homepage-section-title">
            Key Features
          </Typography>
          <Grid container spacing={3} className="homepage-features-grid">
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <Group className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    Real-time Collaboration
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Multiple users can edit documents simultaneously with live updates and conflict resolution.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <Security className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    Role-based Access
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Owner, Editor, and Viewer permissions with secure authentication and user management.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <Psychology className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    AI Writing Assistant
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Grammar improvement, tone enhancement, and smart suggestions powered by AI.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <Speed className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    High Performance
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Optimized algorithms (OT/CRDT) for smooth, lag-free collaborative editing experience.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <CloudSync className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    Cloud Sync
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Automatic saving, version history, and cross-device synchronization.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card className="homepage-feature-card">
                <CardContent>
                  <Edit className="homepage-feature-icon" />
                  <Typography variant="h6" className="homepage-feature-title">
                    Rich Formatting
                  </Typography>
                  <Typography variant="body2" className="homepage-feature-description">
                    Advanced text formatting, tables, images, and comprehensive editing tools.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </section>

        {/* Use Cases Section */}
        <section className="homepage-use-cases">
          <Typography variant="h3" className="homepage-section-title">
            Perfect For
          </Typography>
          <Grid container spacing={3} className="homepage-use-cases-grid">
            <Grid item xs={12} sm={6} md={3}>
              <Card className="homepage-use-case-card">
                <CardContent>
                  <Business className="homepage-use-case-icon" />
                  <Typography variant="h6" className="homepage-use-case-title">
                    Business Teams
                  </Typography>
                  <Typography variant="body2" className="homepage-use-case-description">
                    Real-time collaboration on reports, presentations, and business documents.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="homepage-use-case-card">
                <CardContent>
                  <School className="homepage-use-case-icon" />
                  <Typography variant="h6" className="homepage-use-case-title">
                    Education
                  </Typography>
                  <Typography variant="body2" className="homepage-use-case-description">
                    Collaborative assignments, group projects, and academic paper writing.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="homepage-use-case-card">
                <CardContent>
                  <Edit className="homepage-use-case-icon" />
                  <Typography variant="h6" className="homepage-use-case-title">
                    Content Creation
                  </Typography>
                  <Typography variant="body2" className="homepage-use-case-description">
                    Co-authoring blogs, scripts, and creative writing projects.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card className="homepage-use-case-card">
                <CardContent>
                  <Group className="homepage-use-case-icon" />
                  <Typography variant="h6" className="homepage-use-case-title">
                    Remote Teams
                  </Typography>
                  <Typography variant="body2" className="homepage-use-case-description">
                    Seamless collaboration for distributed teams and remote work.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </section>

        {/* Tech Stack Section */}
        <section className="homepage-tech-stack">
          <Typography variant="h3" className="homepage-section-title">
            Built With Modern Technology
          </Typography>
          <div className="homepage-tech-grid">
            <div className="homepage-tech-category">
              <Typography variant="h6" className="homepage-tech-category-title">
                Frontend
              </Typography>
              <div className="homepage-tech-items">
                <Chip label="React.js" className="homepage-tech-chip" />
                <Chip label="Material-UI" className="homepage-tech-chip" />
                <Chip label="Quill Editor" className="homepage-tech-chip" />
                <Chip label="Handsontable" className="homepage-tech-chip" />
              </div>
            </div>
            <div className="homepage-tech-category">
              <Typography variant="h6" className="homepage-tech-category-title">
                Backend
              </Typography>
              <div className="homepage-tech-items">
                <Chip label="Node.js" className="homepage-tech-chip" />
                <Chip label="Express.js" className="homepage-tech-chip" />
                <Chip label="Socket.IO" className="homepage-tech-chip" />
                <Chip label="JWT Auth" className="homepage-tech-chip" />
              </div>
            </div>
            <div className="homepage-tech-category">
              <Typography variant="h6" className="homepage-tech-category-title">
                Database & Cloud
              </Typography>
              <div className="homepage-tech-items">
                <Chip label="MongoDB" className="homepage-tech-chip" />
                <Chip label="AWS EC2" className="homepage-tech-chip" />
                <Chip label="AWS S3" className="homepage-tech-chip" />
                <Chip label="Redis" className="homepage-tech-chip" />
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="homepage-team">
          <Typography variant="h3" className="homepage-section-title">
            Meet the Team
          </Typography>
          <div className="homepage-team-grid">
            <Card className="homepage-team-card">
              <CardContent>
                <Avatar className="homepage-team-avatar">AS</Avatar>
                <Typography variant="h6" className="homepage-team-name">
                  Abdul Sami
                </Typography>
                <Typography variant="body2" className="homepage-team-role">
                  4472-FBAS/BSCS/F21, Section A
                </Typography>
              </CardContent>
            </Card>
            <Card className="homepage-team-card">
              <CardContent>
                <Avatar className="homepage-team-avatar">MA</Avatar>
                <Typography variant="h6" className="homepage-team-name">
                  Muhammad Attique
                </Typography>
                <Typography variant="body2" className="homepage-team-role">
                  4469-FBAS/BSCS/F21, Section A
                </Typography>
              </CardContent>
            </Card>
            <Card className="homepage-team-card supervisor">
              <CardContent>
                <Avatar className="homepage-team-avatar supervisor">AM</Avatar>
                <Typography variant="h6" className="homepage-team-name">
                  Sir Asim Munir
                </Typography>
                <Typography variant="body2" className="homepage-team-role">
                  Supervisor
                </Typography>
              </CardContent>
            </Card>
          </div>
          <div className="homepage-department">
            <Typography variant="h6" className="homepage-department-title">
              Department of Computer Science
            </Typography>
            <Typography variant="body2" className="homepage-department-subtitle">
              FCIT, IIUI, Islamabad
            </Typography>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage; 