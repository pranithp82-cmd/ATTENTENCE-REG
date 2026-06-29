import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  History,
  Cpu,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar({ currentView, setCurrentView }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const adminMenu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "attendance", label: "Mark Attendance", icon: CalendarCheck },
    { id: "history", label: "History", icon: History },
    { id: "ai", label: "AI Insights", icon: Cpu },
  ];

  const studentMenu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "history", label: "Attendance Log", icon: History },
    { id: "password", label: "Change Password", icon: Lock },
  ];

  const menuItems = user.role === "admin" ? adminMenu : studentMenu;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="brand-logo">ERA SYSTEM</span>
      </header>

      {/* Sidebar Wrapper */}
      <aside
        className={`sidebar glass-panel ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Toggle arrow for desktop */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand/Logo Area */}
        <div className="sidebar-brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-name">ERA</span>
        </div>

        {/* User profile capsule */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user.role === "admin" ? "AD" : user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4 className="profile-name">{user.role === "admin" ? "Administrator" : user.name}</h4>
            <span className="profile-role">{user.role === "admin" ? "Admin Account" : user.studentId}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} className="nav-icon" />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Styles specifically scoped to the Sidebar component structure */}
      <style>{`
        .mobile-header {
          display: none;
          height: 60px;
          background: rgba(11, 10, 20, 0.9);
          border-bottom: 1px solid var(--panel-border);
          align-items: center;
          padding: 0 20px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .mobile-toggle {
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          margin-right: 15px;
        }

        .brand-logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          background: var(--grad-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar {
          width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 25px 15px;
          border-radius: 0 24px 24px 0 !important;
          border-left: none !important;
          z-index: 99;
          transition: var(--transition-smooth);
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-collapse-btn {
          position: absolute;
          right: -12px;
          top: 30px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #171530;
          border: 1px solid var(--panel-border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          transition: var(--transition-smooth);
        }
        .sidebar-collapse-btn:hover {
          color: #fff;
          border-color: var(--neon-purple);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 10px;
          margin-bottom: 30px;
        }

        .brand-icon {
          font-size: 24px;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
        }

        .brand-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          letter-spacing: 0.1em;
          background: linear-gradient(135deg, #fff, var(--neon-purple), var(--neon-pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: var(--transition-smooth);
        }

        .sidebar.collapsed .brand-name {
          opacity: 0;
          pointer-events: none;
        }

        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 25px;
          overflow: hidden;
          transition: var(--transition-smooth);
        }

        .sidebar.collapsed .sidebar-profile {
          padding: 6px;
          justify-content: center;
        }

        .profile-avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: var(--grad-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
          flex-shrink: 0;
        }

        .profile-info {
          transition: var(--transition-smooth);
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar.collapsed .profile-info {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }

        .profile-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        .profile-role {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          background: none;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 15px;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          width: 100%;
          transition: var(--transition-smooth);
        }

        .nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item.active {
          color: #fff;
          background: rgba(168, 85, 247, 0.12);
          border-left: 3px solid var(--neon-purple);
          box-shadow: inset 5px 0 15px rgba(168, 85, 247, 0.05);
        }

        .nav-icon {
          flex-shrink: 0;
          transition: var(--transition-smooth);
        }

        .nav-item.active .nav-icon {
          color: var(--neon-purple);
          filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.6));
        }

        .nav-label {
          transition: var(--transition-smooth);
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-label {
          opacity: 0;
          pointer-events: none;
          width: 0;
        }

        .logout-btn:hover {
          color: var(--neon-pink);
          background: rgba(236, 72, 153, 0.05);
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }

          .sidebar {
            position: fixed;
            top: 60px;
            left: -280px;
            bottom: 0;
            width: 260px;
            height: calc(100vh - 60px);
            border-radius: 0 !important;
            transition: transform 0.3s ease;
          }

          .sidebar.mobile-open {
            transform: translateX(280px);
          }

          .sidebar-collapse-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
