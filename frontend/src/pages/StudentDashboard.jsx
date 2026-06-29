import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import CircularProgress from "../components/CircularProgress";
import { User, Book, Key, FileText, Download, ShieldAlert, Check } from "lucide-react";

export default function StudentDashboard({ currentView, setCurrentView }) {
  const { user, updatePassword } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchStudentData = async () => {
      try {
        // 1. Fetch statistics
        const statsRes = await api.get(`/attendance/student/${user.studentId}`);
        setStats(statsRes.stats);

        // 2. Fetch history log
        const histRes = await api.get(`/attendance?studentId=${user.id}`);
        setHistory(histRes.data);
      } catch (err) {
        showToast("Error loading student records: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user, showToast]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All fields are required.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "warning");
      return;
    }

    setPwLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Route back to dashboard
      setCurrentView("dashboard");
    } catch (err) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const downloadStudentReport = () => {
    if (history.length === 0) {
      showToast("No attendance logs to export", "warning");
      return;
    }

    const headers = ["Date", "Subject", "Status", "Marked By"];
    const rows = history.map((r) => [r.date, `"${r.subject}"`, r.status, r.recordedBy]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${user.name}_attendance_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report downloaded!", "success");
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Retrieving student dashboard credentials...</p>
      </div>
    );
  }

  // Force Password Reset Alert Banner
  const isForceReset = user?.isPasswordResetRequired;

  // Render Sub-Views based on currentView selected in Sidebar
  if (currentView === "password" || isForceReset) {
    return (
      <div className="student-password-change">
        {isForceReset && (
          <div className="force-banner glass-panel animate-float-short">
            <ShieldAlert size={28} className="icon-pink" />
            <div>
              <h3>First Login: Password Reset Mandated</h3>
              <p>For account security, you must replace the temporary password assigned by the Admin before accessing logs.</p>
            </div>
          </div>
        )}

        <div className="pw-card-wrapper glass-panel">
          <h2><Key size={20} className="icon-purple" /> Change Portal Password</h2>
          <p className="subtitle">Update security passcode for student ID: <strong>{user.studentId}</strong></p>

          <form onSubmit={handlePasswordChange} className="pw-form">
            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                className="neon-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>New Security Password</label>
              <input
                type="password"
                className="neon-input"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="neon-input"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="neon-btn neon-btn-primary" disabled={pwLoading}>
              <Check size={16} /> {pwLoading ? "Updating..." : "Save Password"}
            </button>
          </form>
        </div>

        <style>{`
          .student-password-change {
            display: flex;
            flex-direction: column;
            gap: 25px;
            max-width: 500px;
            margin: 0 auto;
            padding-top: 20px;
          }

          .force-banner {
            padding: 20px;
            border-left: 4px solid var(--neon-pink) !important;
            display: flex;
            gap: 15px;
            align-items: center;
            background: rgba(236,72,153,0.03);
          }

          .force-banner h3 {
            color: #fff;
            font-size: 15px;
          }

          .force-banner p {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
          }

          .icon-pink { color: var(--neon-pink); filter: drop-shadow(0 0 5px var(--neon-pink)); }
          .icon-purple { color: var(--neon-purple); filter: drop-shadow(0 0 5px var(--neon-purple)); }

          .pw-card-wrapper {
            padding: 30px;
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .pw-card-wrapper h2 {
            font-size: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .pw-card-wrapper .subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: -10px;
          }

          .pw-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .input-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .input-group label {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
          }

          .pw-form button {
            align-self: flex-start;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  if (currentView === "history") {
    return (
      <div className="student-history-view">
        <div className="page-header">
          <div>
            <h1>My Attendance Logs</h1>
            <p className="page-subtitle">Historical records for Student ID: {user.studentId}</p>
          </div>
          <button className="neon-btn neon-btn-secondary" onClick={downloadStudentReport} disabled={history.length === 0}>
            <Download size={18} /> Download CSV Report
          </button>
        </div>

        <div className="table-wrapper glass-panel">
          {history.length === 0 ? (
            <p className="no-data">No attendance records logged for your account yet.</p>
          ) : (
            <table className="student-logs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject Name</th>
                  <th>Status</th>
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record._id}>
                    <td className="log-date">{record.date}</td>
                    <td className="subj-name">{record.subject}</td>
                    <td>
                      <span className={`badge ${record.status === "Present" ? "badge-present" : "badge-absent"}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="recorded-by">{record.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style>{`
          .student-history-view {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--panel-border);
            padding-bottom: 15px;
            flex-wrap: wrap;
            gap: 15px;
          }

          .page-header h1 {
            font-size: 28px;
            background: linear-gradient(135deg, #fff, var(--text-main));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .page-subtitle {
            font-size: 13px;
            color: var(--text-muted);
          }

          .table-wrapper {
            padding: 20px;
            overflow-x: auto;
          }

          .student-logs-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }

          .student-logs-table th {
            color: var(--text-muted);
            font-size: 12px;
            font-family: var(--font-display);
            font-weight: 600;
            padding: 12px 10px;
            border-bottom: 1px solid var(--panel-border);
            text-transform: uppercase;
          }

          .student-logs-table td {
            padding: 14px 10px;
            border-bottom: 1px solid rgba(255,255,255,0.02);
            font-size: 14px;
          }

          .log-date {
            font-family: monospace;
            color: #fff;
          }

          .subj-name {
            font-weight: 500;
          }

          .recorded-by {
            font-size: 12px;
            color: var(--text-muted);
          }

          .no-data {
            color: var(--text-muted);
            text-align: center;
            padding: 30px 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // DEFAULT view is student dashboard homepage
  const attendanceRate = stats?.percentage ?? 100.0;
  const totalClasses = stats?.total ?? 0;
  const presentClasses = stats?.present ?? 0;
  const absentClasses = stats?.absent ?? 0;

  const isLowAttendance = attendanceRate < 75;

  return (
    <div className="student-home-dashboard">
      <div className="page-header">
        <div>
          <h1>Student Workspace</h1>
          <p className="page-subtitle">Personal attendance overview and academic stats</p>
        </div>
      </div>

      <div className="student-dashboard-grid">
        {/* Profile Card */}
        <div className="profile-details-card glass-panel">
          <h2><User size={18} className="icon-purple" /> Student Profile</h2>
          <div className="avatar-header">
            <div className="large-avatar">{user.name.substring(0, 2).toUpperCase()}</div>
            <div className="main-meta">
              <h3>{user.name}</h3>
              <span>ID: {user.studentId}</span>
            </div>
          </div>

          <div className="profile-fields">
            <div className="p-field">
              <span className="p-lbl">Department</span>
              <span className="p-val">{user.department}</span>
            </div>
            <div className="p-field">
              <span className="p-lbl">Academic Year</span>
              <span className="p-val">Year {user.year}</span>
            </div>
            <div className="p-field">
              <span className="p-lbl">Email Address</span>
              <span className="p-val">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Circular Percentage stats */}
        <div className="circular-stats-card glass-panel">
          <h3>Overall Compliance</h3>
          <div className="radial-wrapper">
            <CircularProgress
              percentage={attendanceRate}
              size={170}
              strokeWidth={14}
              color={isLowAttendance ? "pink" : "purple"}
            />
          </div>
          <div className="summary-badges">
            <div className="sum-badge">
              <span className="val">{totalClasses}</span>
              <span className="lbl">Classes</span>
            </div>
            <div className="sum-badge green">
              <span className="val">{presentClasses}</span>
              <span className="lbl">Present</span>
            </div>
            <div className="sum-badge red">
              <span className="val">{absentClasses}</span>
              <span className="lbl">Absent</span>
            </div>
          </div>
          {isLowAttendance && (
            <div className="warning-note glass-panel">
              <ShieldAlert size={16} className="icon-pink" />
              <span>Warning: Attendance below critical threshold (75%).</span>
            </div>
          )}
        </div>
      </div>

      {/* Subject breakdowns */}
      <div className="subjects-breakdown-card glass-panel">
        <h2><Book size={18} className="icon-blue" /> Subject Attendance Breakdowns</h2>
        {(!stats?.subjects || stats.subjects.length === 0) ? (
          <p className="no-data">No subject breakdowns logged yet.</p>
        ) : (
          <div className="subjects-prog-grid">
            {stats.subjects.map((sub) => {
              const subLow = sub.percentage < 75;
              return (
                <div key={sub.subject} className="sub-prog-item">
                  <div className="sub-prog-info">
                    <span className="sub-prog-name">{sub.subject}</span>
                    <span className="sub-prog-pct">{sub.percentage}% ({sub.present}/{sub.total})</span>
                  </div>
                  <div className="progress-bar-rail">
                    <div
                      className={`progress-bar-fill ${subLow ? "fill-pink" : "fill-blue"}`}
                      style={{ width: `${sub.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .student-home-dashboard {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 15px;
        }

        .page-header h1 {
          font-size: 28px;
          background: linear-gradient(135deg, #fff, var(--text-main));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }

        .student-dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .student-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-details-card, .circular-stats-card, .subjects-breakdown-card {
          padding: 25px;
        }

        .profile-details-card h2, .subjects-breakdown-card h2 {
          font-size: 18px;
          color: #fff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--panel-border);
        }

        .large-avatar {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          background: var(--grad-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 20px;
          color: #fff;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
        }

        .main-meta h3 {
          color: #fff;
          font-size: 18px;
        }

        .main-meta span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .profile-fields {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .p-field {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 8px;
          font-size: 14px;
        }

        .p-lbl {
          color: var(--text-muted);
        }

        .p-val {
          color: #fff;
          font-weight: 500;
        }

        .circular-stats-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .circular-stats-card h3 {
          font-size: 15px;
          align-self: flex-start;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .radial-wrapper {
          margin: 10px 0;
        }

        .summary-badges {
          display: flex;
          gap: 15px;
          width: 100%;
        }

        .sum-badge {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 8px;
        }

        .sum-badge .val {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }

        .sum-badge .lbl {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .sum-badge.green {
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.02);
        }
        .sum-badge.green .val { color: #10b981; }

        .sum-badge.red {
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.02);
        }
        .sum-badge.red .val { color: #ef4444; }

        .warning-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-color: rgba(236,72,153,0.3) !important;
          background: rgba(236,72,153,0.03);
          color: var(--neon-pink);
          font-size: 11px;
          font-weight: 600;
          border-radius: 8px;
        }

        .subjects-prog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .sub-prog-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sub-prog-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .sub-prog-name {
          color: #fff;
          font-weight: 500;
        }

        .sub-prog-pct {
          color: var(--text-muted);
        }

        .progress-bar-rail {
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
        }

        .progress-bar-fill.fill-blue {
          background: var(--neon-blue);
          box-shadow: 0 0 8px var(--neon-blue);
        }

        .progress-bar-fill.fill-pink {
          background: var(--neon-pink);
          box-shadow: 0 0 8px var(--neon-pink);
        }

        .icon-blue { color: var(--neon-blue); filter: drop-shadow(0 0 4px var(--neon-blue)); }
      `}</style>
    </div>
  );
}
