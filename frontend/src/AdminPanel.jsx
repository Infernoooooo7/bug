import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AdminPanel.css"; 

const AdminPanel = ({ handleLogout }) => {
  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="shield">🛡️</div>
          <span>Phish<span style={{ color: "var(--admin-primary)" }}>Forensics</span></span>
        </div>

        <div className="sidebar-section-title">Main</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>🏠 Dashboard</NavLink>
          <NavLink to="/scan" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>✉️ Scan Email</NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>🕒 Scan History</NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>🛡️ Admin Panel</NavLink>
          <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>👥 Users</NavLink>
          <NavLink to="/threat-intel" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>🎯 Threat Intel</NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>⚙️ Settings</NavLink>
        </nav>

        <div className="sidebar-section-title">System Overview</div>
        <div className="sidebar-status">
          <div className="status-item">
            <span className="status-label">System Status</span>
            <span className="status-val">Online</span>
          </div>
          <div className="status-item">
            <span className="status-label">Database</span>
            <span className="status-val">Connected</span>
          </div>
          <div className="status-item">
            <span className="status-label">API Services</span>
            <span className="status-val">Operational</span>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <div className="admin-glow"></div>
        
        {/* TOPBAR */}
        <header className="admin-header">
          <div style={{ width: "20px" }}>{/* Placeholder for menu icon if needed */}</div>
          <div className="header-title">Advanced Threat Intelligence Sandbox</div>
          
          <div className="header-actions">
            <div className="header-icon" title="Toggle Dark Mode">🌙</div>
            <div className="header-icon" title="Notifications">🔔</div>
            <div className="profile-card">
              <div className="profile-info" style={{ textAlign: "right" }}>
                <span className="profile-name">Admin</span>
                <span className="profile-role">Super Administrator</span>
              </div>
              <div className="profile-avatar">A</div>
            </div>
            <button onClick={handleLogout} className="logout-btn" style={{marginLeft: '12px', padding: '6px 12px'}}>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
          <footer className="admin-footer">
            🛡️ © 2026 PhishForensics. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
