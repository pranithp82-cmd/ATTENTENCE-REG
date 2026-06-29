import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import { Cpu, AlertTriangle, TrendingUp, Info, HelpCircle, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await api.get("/ai/insights");
        setData(res);
        showToast("AI data science compilation complete.", "success");
      } catch (err) {
        showToast("AI Engine fail: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, [showToast]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Compiling ML risk matrices & trend projections...</p>
      </div>
    );
  }

  // Risk distribution for Pie Chart
  const riskList = data?.risk_predictions || [];
  const highRisk = riskList.filter((r) => r.risk_level === "High").length;
  const medRisk = riskList.filter((r) => r.risk_level === "Medium").length;
  const lowRisk = riskList.filter((r) => r.risk_level === "Low").length;

  const pieData = [
    { name: "High Risk", value: highRisk, color: "var(--neon-pink)" },
    { name: "Medium Risk", value: medRisk, color: "#f59e0b" },
    { name: "Low Risk", value: lowRisk, color: "#10b981" },
  ].filter((item) => item.value > 0); // exclude empty categories

  // Trend data splitting: historical vs forecast
  const forecastData = data?.forecast || [];
  const historicalPoints = forecastData.filter((p) => p.type === "Historical");
  const forecastPoints = forecastData.filter((p) => p.type === "Forecast");

  // Create unified array for chart, connecting the last historical point with the first forecast point
  const chartTimeline = [...historicalPoints];
  if (historicalPoints.length > 0 && forecastPoints.length > 0) {
    // Add last historical point to forecast sequence for visual continuity
    const lastHist = historicalPoints[historicalPoints.length - 1];
    chartTimeline.push({
      date: lastHist.date,
      percentage: lastHist.percentage,
      type: "Forecast",
    });
  }
  chartTimeline.push(...forecastPoints);

  // Recommendations List (Critical cases first)
  const criticalInterventions = riskList.filter((r) => r.risk_level === "High" || r.risk_level === "Medium");

  return (
    <div className="ai-insights-page">
      <div className="page-header">
        <div>
          <h1><Cpu className="title-icon" size={24} /> ERA Intelligence</h1>
          <p className="page-subtitle">Predictive ML Risk Assessment and Trend Forecasting Engine</p>
        </div>
        <span className="ai-badge">Engine: Scikit-learn V1.3</span>
      </div>

      {/* Main Charts Row */}
      <div className="charts-row">
        {/* Trend Forecast */}
        <div className="chart-wrapper glass-panel flex-2">
          <div className="chart-header">
            <h3><TrendingUp size={16} className="icon-blue" /> 7-Day Attendance Forecast Projection</h3>
            <span className="info-tag">Linear Regression Model</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartTimeline}>
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
                {/* Historical Line */}
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--neon-blue)"
                  strokeWidth={3}
                  name="Historical Attendance"
                  dot={{ r: 3, fill: "var(--neon-blue)" }}
                  activeDot={{ r: 5 }}
                />
                {/* Dotted Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--neon-pink)"
                  strokeDasharray="5 5"
                  strokeWidth={3}
                  name="ML Forecasted Rate"
                  dot={{ r: 4, fill: "var(--neon-pink)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="chart-wrapper glass-panel flex-1">
          <h3>Risk Level Distribution</h3>
          {pieData.length === 0 ? (
            <p className="no-data">Insufficient logs for distribution modeling.</p>
          ) : (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0c0a1f",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-summary">
                <span className="pie-stat font-pink">{highRisk} Critical</span>
                <span className="pie-stat font-orange">{medRisk} Warning</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intervention Panel */}
      <div className="intervention-panel glass-panel">
        <div className="panel-header">
          <h2><AlertTriangle size={20} className="icon-orange" /> Recommended Academic Interventions</h2>
          <p className="desc">Students projected to fall below the 75% attendance threshold</p>
        </div>

        {criticalInterventions.length === 0 ? (
          <div className="no-risk-alert">
            <CheckCircle2 size={32} className="success-icon" />
            <p>Excellent status. All active students maintain attendance above 75% threshold.</p>
          </div>
        ) : (
          <div className="risk-table-wrapper">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Attendance %</th>
                  <th>Risk Level</th>
                  <th>ML Probability</th>
                  <th>Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {criticalInterventions.map((student) => (
                  <tr key={student.studentId} className={`risk-row-${student.risk_level.toLowerCase()}`}>
                    <td>
                      <div className="stud-detail">
                        <span className="s-name">{student.name}</span>
                        <span className="s-id">{student.studentId}</span>
                      </div>
                    </td>
                    <td>{student.department} • Year {student.year}</td>
                    <td className="font-bold">{student.current_rate}%</td>
                    <td>
                      <span className={`badge ${student.risk_level === "High" ? "badge-high" : "badge-medium"}`}>
                        {student.risk_level} Risk
                      </span>
                    </td>
                    <td>
                      <div className="risk-prob-bar-container">
                        <span className="prob-val">{student.risk_probability}%</span>
                        <div className="prob-bar">
                          <div
                            className="prob-fill"
                            style={{
                              width: `${student.risk_probability}%`,
                              background: student.risk_level === "High" ? "var(--neon-pink)" : "#f59e0b",
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="recommendation-cell">
                      <span className="recomm-bubble">{student.recommendation}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .ai-insights-page {
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

        .title-icon {
          color: var(--neon-purple);
          filter: drop-shadow(0 0 5px var(--neon-purple));
          display: inline-block;
          vertical-align: middle;
          margin-right: 5px;
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

        .ai-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--neon-purple);
          background: rgba(168, 85, 247, 0.1);
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid rgba(168, 85, 247, 0.2);
          text-transform: uppercase;
        }

        .charts-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .chart-wrapper {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .flex-2 { flex: 2; min-width: 450px; }
        .flex-1 { flex: 1; min-width: 280px; }

        @media (max-width: 768px) {
          .flex-2, .flex-1 {
            flex: 1;
            min-width: 100%;
          }
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-header h3 {
          font-size: 16px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-blue {
          color: var(--neon-blue);
          filter: drop-shadow(0 0 4px var(--neon-blue));
        }

        .icon-orange {
          color: #f59e0b;
          filter: drop-shadow(0 0 4px #f59e0b);
        }

        .info-tag {
          font-size: 11px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .pie-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pie-summary {
          display: flex;
          gap: 15px;
          margin-top: 10px;
        }

        .pie-stat {
          font-size: 13px;
          font-weight: 600;
        }

        .font-pink { color: var(--neon-pink); }
        .font-orange { color: #f59e0b; }

        .intervention-panel {
          padding: 25px;
        }

        .panel-header {
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .panel-header h2 {
          font-size: 18px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .panel-header .desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .no-risk-alert {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 30px 0;
          color: #10b981;
          text-align: center;
        }

        .success-icon {
          color: #10b981;
          filter: drop-shadow(0 0 5px #10b981);
        }

        .risk-table-wrapper {
          overflow-x: auto;
        }

        .risk-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .risk-table th {
          color: var(--text-muted);
          font-size: 12px;
          font-family: var(--font-display);
          font-weight: 600;
          padding: 12px 10px;
          border-bottom: 1px solid var(--panel-border);
          text-transform: uppercase;
        }

        .risk-table td {
          padding: 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          font-size: 14px;
        }

        .stud-detail {
          display: flex;
          flex-direction: column;
        }

        .s-name {
          color: #fff;
          font-weight: 500;
        }

        .s-id {
          font-size: 11px;
          color: var(--text-muted);
        }

        .font-bold {
          font-weight: 700;
        }

        .risk-row-high {
          background: rgba(236, 72, 153, 0.01);
        }

        .risk-row-medium {
          background: rgba(245, 158, 11, 0.01);
        }

        .risk-prob-bar-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 120px;
        }

        .prob-val {
          font-size: 12px;
          font-weight: 700;
        }

        .prob-bar {
          height: 5px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .prob-fill {
          height: 100%;
          border-radius: 4px;
        }

        .recommendation-cell {
          max-width: 250px;
        }

        .recomm-bubble {
          font-size: 12px;
          color: var(--text-main);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 4px 10px;
          border-radius: 12px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
