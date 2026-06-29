import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Shield, User, Lock, Key } from "lucide-react";

export default function Landing() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdmin) {
        if (!username || !password) {
          showToast("Please enter all fields", "warning");
          setLoading(false);
          return;
        }
        await login("admin", { username, password });
        showToast("Welcome Admin, logged in successfully!", "success");
      } else {
        if (!studentId || !password) {
          showToast("Please enter student ID and password", "warning");
          setLoading(false);
          return;
        }
        const loggedInUser = await login("student", { studentId, password });
        showToast(`Welcome back, ${loggedInUser.name}!`, "success");
      }
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message || "Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="brand-header animate-float">
        <h1 className="main-title">E R A</h1>
        <p className="subtitle">AI-Powered Attendance Management System</p>
      </div>

      <div className="login-card glass-panel">
        <div className="login-tabs">
          <button
            className={`tab-btn ${!isAdmin ? "active" : ""}`}
            onClick={() => {
              setIsAdmin(false);
              setPassword("");
            }}
          >
            <User size={18} />
            Student Portal
          </button>
          <button
            className={`tab-btn ${isAdmin ? "active" : ""}`}
            onClick={() => {
              setIsAdmin(true);
              setPassword("");
            }}
          >
            <Shield size={18} />
            Admin Portal
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isAdmin ? "Admin Authentication" : "Student Login"}</h2>
          <p className="form-description">
            {isAdmin
              ? "Access administrative tools and dashboard."
              : "Enter your Student ID and passcode."}
          </p>

          <div className="input-group">
            <label>{isAdmin ? "Admin Username" : "Student ID"}</label>
            <div className="input-wrapper">
              {isAdmin ? <Shield className="input-icon" size={18} /> : <User className="input-icon" size={18} />}
              <input
                className="neon-input"
                type="text"
                placeholder={isAdmin ? "Enter admin username" : "e.g., CS2026001"}
                value={isAdmin ? username : studentId}
                onChange={(e) => (isAdmin ? setUsername(e.target.value) : setStudentId(e.target.value))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Security Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                className="neon-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button className="neon-btn neon-btn-primary submit-btn" type="submit" disabled={loading}>
            <Key size={18} />
            {loading ? "Authenticating..." : "Login Portal"}
          </button>
        </form>
      </div>

      <style>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .brand-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .main-title {
          font-size: 54px;
          font-weight: 800;
          letter-spacing: 0.25em;
          background: linear-gradient(135deg, #fff, var(--neon-purple), var(--neon-pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.4));
          font-family: var(--font-display);
        }

        .subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin-top: 5px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .login-card {
          max-width: 440px;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }

        .login-tabs {
          display: flex;
          border-bottom: 1px solid var(--panel-border);
          background: rgba(0, 0, 0, 0.2);
        }

        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 16px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }

        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .tab-btn.active {
          color: #fff;
          background: var(--panel-bg);
          border-bottom: 2px solid var(--neon-purple);
          text-shadow: 0 0 8px rgba(168, 85, 247, 0.5);
        }

        .login-form {
          padding: 35px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form h2 {
          color: #fff;
          font-size: 22px;
        }

        .form-description {
          color: var(--text-muted);
          font-size: 13px;
          margin-top: -10px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding-left: 42px !important;
        }

        .submit-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 15px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
