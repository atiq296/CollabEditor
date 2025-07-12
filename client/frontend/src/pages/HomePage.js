import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="homepage-root">
      <header className="homepage-header">
        <div className="homepage-logo">CollabEditor</div>
        <div className="homepage-header-buttons">
          <Button variant="outlined" className="homepage-signup-btn" onClick={() => navigate("/signup")}>Sign Up</Button>
          <Button variant="contained" className="homepage-login-btn" onClick={() => navigate("/login")}>Login</Button>
        </div>
      </header>
      <main className="homepage-main">
        <section className="homepage-hero">
          <div className="homepage-hero-images">
            <div className="doc-icon">
              {/* Placeholder SVG for document */}
              <svg width="90" height="110" viewBox="0 0 90 110"><rect x="10" y="10" width="70" height="90" rx="12" fill="#e3eafc" stroke="#274690" strokeWidth="3"/><rect x="20" y="30" width="50" height="8" rx="2" fill="#b3c7f9"/><rect x="20" y="45" width="40" height="8" rx="2" fill="#b3c7f9"/><rect x="20" y="60" width="30" height="8" rx="2" fill="#b3c7f9"/></svg>
            </div>
            <div className="sheet-icon">
              {/* Placeholder SVG for spreadsheet */}
              <svg width="90" height="110" viewBox="0 0 90 110"><rect x="10" y="10" width="70" height="90" rx="12" fill="#e0f7fa" stroke="#1dc8e9" strokeWidth="3"/><rect x="20" y="30" width="50" height="8" rx="2" fill="#5ee7df"/><rect x="20" y="45" width="50" height="8" rx="2" fill="#5ee7df"/><rect x="20" y="60" width="50" height="8" rx="2" fill="#5ee7df"/></svg>
            </div>
          </div>
          <div className="homepage-hero-text">
            <h1>CollabEditor</h1>
            <p className="homepage-tagline">Collaborate on documents and spreadsheets in real time, from anywhere.</p>
          </div>
        </section>
        <section className="homepage-about">
          <h2>About the Project</h2>
          <p>CollabEditor is a real-time, web-based collaborative editor for documents and spreadsheets. It features live editing, role-based permissions, version control, and advanced algorithms (OT/CRDT) for conflict-free updates. Designed for teams and individuals, it empowers users to collaborate with live updates, rich-text formatting, change tracking, and robust access controls—all in your browser.</p>
        </section>
        <section className="homepage-features">
          <h2>Key Features</h2>
          <ul>
            <li>Real-time collaborative editing for documents and spreadsheets</li>
            <li>Role-based access: Owner, Editor, Viewer</li>
            <li>Version history and change tracking</li>
            <li>Rich-text formatting, tables, images, and comments</li>
            <li>Live user indicators and chat</li>
            <li>AI-powered grammar, summarization, and smart suggestions</li>
            <li>Secure authentication and user management</li>
            <li>Modern, responsive, and accessible design</li>
            <li>Integrated spreadsheet module with import/export</li>
            <li>Scalable backend with WebSockets, Redis, and cloud hosting</li>
          </ul>
        </section>
        <section className="homepage-app-areas">
          <h2>Application Areas</h2>
          <ul>
            <li>Corporate Teams: Real-time collaboration on business reports and presentations</li>
            <li>Educational Institutions: Collaborative assignments and group projects for students</li>
            <li>Content Creation: Co-authoring blogs, scripts, or academic papers</li>
            <li>Any setting where teamwork and coordination are critical</li>
          </ul>
        </section>
        <section className="homepage-tech-stack">
          <h2>Tech Stack</h2>
          <ul>
            <li><b>Frontend:</b> React.js, Tailwind CSS, Quill</li>
            <li><b>Backend:</b> Node.js, Express.js, Socket.IO</li>
            <li><b>Database:</b> MongoDB with Mongoose</li>
            <li><b>Hosting:</b> AWS EC2, AWS S3, Dropbox</li>
            <li><b>Authentication:</b> JWT (JSON Web Tokens)</li>
          </ul>
        </section>
        <section className="homepage-team">
          <h2>Meet the Team</h2>
          <div className="homepage-team-list">
            <div className="team-member">Abdul Sami<br /><span className="team-meta">4472-FBAS/BSCS/F21, Section A</span></div>
            <div className="team-member">Muhammad Attique<br /><span className="team-meta">4469-FBAS/BSCS/F21, Section A</span></div>
            <div className="team-member">Supervised By<br /><span className="team-meta">Sir Asim Munir</span></div>
            <div className="team-member">Department of Computer Science<br /><span className="team-meta">FCIT, IIUI, Islamabad</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage; 