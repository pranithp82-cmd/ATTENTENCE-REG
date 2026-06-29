import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import Card from "../components/Card";
import { Users, Percent, AlertOctagon, Layers, ArrowRight, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard({ setCurrentView, setQuickFilter }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.get("/ai/insights");
        setData(stats);
      } catch (err) {
        console.error("Error loading dashboard statistics:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Analyzing database archives...</p>
      </div>
    );
  }

  const overallAttendance = data?.overall_attendance || 0;
  const totalStudents = data?.total_students || 0;
  const departmentsCount = data?.stats_by_department?.length || 0;

  // At-risk students counts
  const atRiskCount = data?.risk_predictions?.filter(
    (p) => p.risk_level === "High" || p.risk_level === "Medium"
  ).length || 0;

  const highRiskStudents = data?.risk_predictions?.filter((p) => p.risk_level === "High") || [];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1>Control Center</h1>
          <p className="page-subtitle">ERA Administrative Analytics Dashboard</p>
        </div>
        <span className="system-time">System Status: Active</span>
      </div>

      {/* Analytics Cards */}
      <div className="stats-grid">
        <Card
          title="Total Enrollment"
          value={totalStudents}
          icon={Users}
          color="purple"
          trend="Live Student Base"
        />
        <Card
          title="Average Attendance"
          value={`${overallAttendance}%`}
          icon={Percent}
          color="blue"
          trend={overallAttendance >= 75 ? "Above Required (75%)" : "Below Required!"}
          trendType={overallAttendance >= 75 ? "positive" : "negative"}
        />
        <Card
          title="At-Risk Students"
          value={atRiskCount}
          icon={AlertOctagon}
          color="pink"
          trend={`${highRiskStudents.length} Critical (High Risk)`}
          trendType={atRiskCount > 0 ? "negative" : "positive"}
        />
        <Card
          title="Departments"
          value={departmentsCount}
          icon={Layers}
          color="purple"
          trend="Active Academic Units"
        />
      </div>

      <div className="dashboard-charts-grid">
        {/* Department performance */}
        <div className="chart-card glass-panel">
          <h3>Departmental Attendance Rates</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.stats_by_department || []}>
                <XAxis dataKey="department" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0c0a1f",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Bar dataKey="percentage" fill="url(#purpleBlueGrad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="purpleBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon-purple)" />
                    <stop offset="100%" stopColor="var(--neon-blue)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Timeline trend */}
        <div className="chart-card glass-panel">
          <h3>Attendance Trend (Last 15 Days)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={(data?.forecast || []).filter((f) => f.type === "Historical").slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0c0a1f",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--neon-pink)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--neon-pink)", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alerts and Quick Actions */}
      <div className="dashboard-footer-grid">
        {/* At-risk Quick Alert list */}
        <div className="alerts-card glass-panel">
          <div className="card-header">
            <h3><ShieldAlert size={18} className="icon-pink" /> Critical Interventions Pending</h3>
            <button className="text-btn" onClick={() => setCurrentView("ai")}>
              View AI Module <ArrowRight size={14} />
            </button>
          </div>
          {highRiskStudents.length === 0 ? (
            <p className="no-data">No students in critical risk status.</p>
          ) : (
            <div className="alerts-list">
              {highRiskStudents.slice(0, 4).map((student) => (
                <div key={student.studentId} className="alert-item">
                  <div className="alert-stud-info">
                    <span className="alert-name">{student.name}</span>
                    <span className="alert-id">{student.studentId} • {student.department}</span>
                  </div>
                  <div className="alert-status">
                    <span className="badge badge-high">{student.current_rate}% Attendance</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions List */}
        <div className="actions-card glass-panel">
          <h3>Operations Hub</h3>
          <div className="actions-buttons">
            <button className="neon-btn neon-btn-primary" onClick={() => setCurrentView("attendance")}>
              Mark Daily Logs
            </button>
            <button className="neon-btn neon-btn-secondary" onClick={() => setCurrentView("students")}>
              Register New Students
            </button>
            <button className="neon-btn neon-btn-secondary" onClick={() => setCurrentView("history")}>
              Audit Attendance logs
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
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

        .system-time {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .dashboard-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 20px;
        }

        @media (max-width: 550px) {
          .dashboard-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 22px;
        }

        .chart-card h3 {
          margin-bottom: 20px;
          font-size: 16px;
          color: #fff;
        }

        .dashboard-footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .dashboard-footer-grid {
            grid-template-columns: 1fr;
          }
        }

        .alerts-card, .actions-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .alerts-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alerts-card h3 {
          font-size: 16px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-pink {
          color: var(--neon-pink);
          filter: drop-shadow(0 0 4px var(--neon-pink));
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--neon-purple);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .text-btn:hover {
          color: #fff;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }

        .alert-stud-info {
          display: flex;
          flex-direction: column;
        }

        .alert-name {
          font-size: 14px;
          color: #fff;
          font-weight: 500;
        }

        .alert-id {
          font-size: 11px;
          color: var(--text-muted);
        }

        .no-data {
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          padding: 20px 0;
        }

        .actions-card h3 {
          font-size: 16px;
          color: #fff;
          margin-bottom: 5px;
        }

        .actions-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .actions-buttons button {
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
