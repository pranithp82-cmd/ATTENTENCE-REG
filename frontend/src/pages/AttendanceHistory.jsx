import React, { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import { Calendar, Filter, FileText, Download, AlertCircle } from "lucide-react";

export default function AttendanceHistory() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("All");
  const [year, setYear] = useState("All");
  const [subject, setSubject] = useState("All");

  const { showToast } = useToast();

  // Load departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/misc/departments");
        setDepartments(res.data);
      } catch (err) {
        showToast("Error loading departments: " + err.message, "error");
      }
    };
    fetchDepts();
  }, [showToast]);

  // Load subjects dynamically on department change
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        let endpoint = "/misc/subjects";
        if (department !== "All") {
          endpoint += `?department=${encodeURIComponent(department)}`;
        }
        const res = await api.get(endpoint);
        setSubjects(res.data);
        setSubject("All"); // Reset subject selection
      } catch (err) {
        showToast("Error loading subjects: " + err.message, "error");
      }
    };
    fetchSubjects();
  }, [department, showToast]);

  // Query records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let query = "/attendance?";
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (department !== "All") params.push(`department=${encodeURIComponent(department)}`);
      if (year !== "All") params.push(`year=${year}`);
      if (subject !== "All") params.push(`subject=${encodeURIComponent(subject)}`);

      query += params.join("&");

      const res = await api.get(query);
      setRecords(res.data);
      showToast(`Found ${res.data.length} records.`, "success");
    } catch (err) {
      showToast("Error loading history: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, department, year, subject, showToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // CSV Exporter
  const exportToCSV = () => {
    if (records.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    const headers = ["Student ID", "Name", "Date", "Department", "Year", "Subject", "Status", "Marked By"];
    const rows = records.map((r) => [
      r.student?.studentId || "N/A",
      `"${r.student?.name || "N/A"}"`,
      r.date,
      r.department,
      `Year ${r.year}`,
      `"${r.subject}"`,
      r.status,
      r.recordedBy,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Download initiated!", "success");
  };

  // PDF Exporter (Window layout printable document view triggering direct browser print dialog)
  const exportToPDF = () => {
    if (records.length === 0) {
      showToast("No data to print", "warning");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Popup blocked! Enable popups to download PDF", "error");
      return;
    }

    const htmlContent = `
      <html>
      <head>
        <title>ERA System Attendance Report</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            padding: 40px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #a855f7;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            color: #0b0a14;
            letter-spacing: 2px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            font-size: 13px;
          }
          .meta-item strong {
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 35px;
          }
          th {
            background-color: #f3f4f6;
            border-bottom: 2px solid #e5e7eb;
            color: #374151;
            font-weight: 700;
            text-align: left;
            padding: 10px;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .badge {
            padding: 3px 6px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
          }
          .present {
            background-color: #d1fae5;
            color: #065f46;
          }
          .absent {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
            position: fixed;
            bottom: 20px;
            left: 40px;
            right: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ERA ATTENDANCE REPORT</h1>
          <p>Official Academic Archives</p>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
          <div class="meta-item"><strong>Department:</strong> ${department}</div>
          <div class="meta-item"><strong>Subject Filter:</strong> ${subject}</div>
          <div class="meta-item"><strong>Year Filter:</strong> ${year === "All" ? "All Years" : `Year ${year}`}</div>
          <div class="meta-item"><strong>Total Records:</strong> ${records.length} Logs</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Date</th>
              <th>Department</th>
              <th>Year</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr>
                <td><strong>${r.student?.studentId || "N/A"}</strong></td>
                <td>${r.student?.name || "N/A"}</td>
                <td>${r.date}</td>
                <td>${r.department}</td>
                <td>Year ${r.year}</td>
                <td>${r.subject}</td>
                <td>
                  <span class="badge ${r.status === "Present" ? "present" : "absent"}">
                    ${r.status}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by ERA Attendance System Control Core. Confidential. Page 1 of 1
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast("PDF report preview loaded! Proceed in system print dialogue.", "success");
  };

  return (
    <div className="attendance-history">
      <div className="page-header">
        <div>
          <h1>Attendance Audit Logs</h1>
          <p className="page-subtitle">Track, filter, and extract history logs and records</p>
        </div>
        <div className="header-actions">
          <button className="neon-btn neon-btn-secondary" onClick={exportToCSV} disabled={records.length === 0}>
            <Download size={18} /> Export CSV
          </button>
          <button className="neon-btn neon-btn-primary" onClick={exportToPDF} disabled={records.length === 0}>
            <FileText size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="filter-panel glass-panel">
        <div className="filter-form-grid">
          <div className="filter-input-group">
            <label><Calendar size={13} /> Start Date</label>
            <input
              type="date"
              className="neon-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label><Calendar size={13} /> End Date</label>
            <input
              type="date"
              className="neon-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label><Filter size={13} /> Department</label>
            <select
              className="neon-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Year</label>
            <select
              className="neon-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="All">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label>Subject</label>
            <select
              className="neon-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log list table */}
      <div className="table-wrapper glass-panel">
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Accessing historical archives...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="no-records">
            <AlertCircle size={22} className="alert-icon" />
            <p>No historical attendance matches found. Try adjusting filter scopes.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Date</th>
                <th>Department</th>
                <th>Year</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r._id || idx}>
                  <td>
                    <span className="student-id-badge">{r.student?.studentId || "N/A"}</span>
                  </td>
                  <td className="student-name">{r.student?.name || "Deleted Student"}</td>
                  <td className="log-date">{r.date}</td>
                  <td>{r.department}</td>
                  <td>Year {r.year}</td>
                  <td className="subject-cell">{r.subject}</td>
                  <td>
                    <span className={`badge ${r.status === "Present" ? "badge-present" : "badge-absent"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="recorded-by">{r.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .attendance-history {
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

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .filter-panel {
          padding: 22px;
        }

        .filter-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }

        .filter-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-input-group label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .table-wrapper {
          padding: 20px;
          overflow-x: auto;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .history-table th {
          color: var(--text-muted);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 15px 12px;
          border-bottom: 1px solid var(--panel-border);
        }

        .history-table td {
          padding: 15px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          font-size: 14px;
        }

        .student-id-badge {
          background: rgba(168, 85, 247, 0.1);
          color: var(--neon-purple);
          border: 1px solid rgba(168, 85, 247, 0.2);
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          font-family: var(--font-display);
        }

        .student-name {
          color: #fff;
          font-weight: 500;
        }

        .log-date {
          font-family: monospace;
          color: var(--text-main);
        }

        .subject-cell {
          font-weight: 500;
        }

        .recorded-by {
          font-size: 12px;
          color: var(--text-muted);
        }

        .no-records {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 45px 0;
          color: var(--text-muted);
        }

        .alert-icon {
          color: var(--neon-blue);
          filter: drop-shadow(0 0 5px var(--neon-blue));
        }
      `}</style>
    </div>
  );
}
