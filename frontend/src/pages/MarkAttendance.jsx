import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import { Calendar, Layers, BookOpen, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function MarkAttendance() {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selections
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Student Sheet State
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [loadingList, setLoadingList] = useState(false);
  const [hasLoadedList, setHasLoadedList] = useState(false);
  const [savingLogs, setSavingLogs] = useState(false);

  const { showToast } = useToast();

  // Load departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/misc/departments");
        setDepartments(res.data);
        if (res.data.length > 0) {
          setSelectedDept(res.data[0].name);
        }
      } catch (err) {
        showToast("Error loading departments: " + err.message, "error");
      }
    };
    fetchDepts();
  }, [showToast]);

  // Load subjects dynamically when selected department changes
  useEffect(() => {
    if (!selectedDept) return;
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/misc/subjects?department=${encodeURIComponent(selectedDept)}`);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].name);
        } else {
          setSelectedSubject("");
        }
      } catch (err) {
        showToast("Error loading subjects: " + err.message, "error");
      }
    };
    fetchSubjects();
  }, [selectedDept, showToast]);

  // Load Student sheet for marking
  const handleLoadSheet = async (e) => {
    e.preventDefault();
    if (!selectedDept || !selectedSubject) {
      showToast("Ensure Department and Subject are selected.", "warning");
      return;
    }

    setLoadingList(true);
    setHasLoadedList(false);
    try {
      // 1. Fetch all students in this department and year
      const studentsRes = await api.get(
        `/students?limit=100&department=${encodeURIComponent(selectedDept)}&year=${selectedYear}`
      );
      const studentList = studentsRes.data;

      if (studentList.length === 0) {
        setStudents([]);
        setHasLoadedList(true);
        setLoadingList(false);
        return;
      }

      // 2. Fetch existing logs for this date, dept, year, and subject
      const attendanceRes = await api.get(
        `/attendance?startDate=${date}&endDate=${date}&department=${encodeURIComponent(
          selectedDept
        )}&year=${selectedYear}&subject=${encodeURIComponent(selectedSubject)}`
      );
      const existingLogs = attendanceRes.data;

      // 3. Build state map: defaults to 'Present' unless a log exists
      const newMap = {};
      studentList.forEach((stud) => {
        const log = existingLogs.find((l) => l.student._id.toString() === stud._id.toString());
        newMap[stud._id] = log ? log.status : "Present";
      });

      setStudents(studentList);
      setAttendanceMap(newMap);
      setHasLoadedList(true);
      showToast(`Loaded ${studentList.length} student sheets for marking.`, "info");
    } catch (err) {
      showToast("Failed to load attendance sheet: " + err.message, "error");
    } finally {
      setLoadingList(false);
    }
  };

  // Toggle status for individual student
  const toggleStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Mark all helpers
  const markAll = (status) => {
    const newMap = {};
    students.forEach((s) => {
      newMap[s._id] = status;
    });
    setAttendanceMap(newMap);
    showToast(`Marked all students as ${status}`, "info");
  };

  // Submit attendance records to server
  const handleSubmitAttendance = async () => {
    setSavingLogs(true);
    try {
      const records = Object.keys(attendanceMap).map((studentId) => ({
        studentId,
        status: attendanceMap[studentId],
      }));

      const res = await api.post("/attendance", {
        date,
        department: selectedDept,
        year: selectedYear,
        subject: selectedSubject,
        records,
      });

      if (res.success) {
        showToast("Attendance marked and updated in databases successfully!", "success");
      }
    } catch (err) {
      showToast("Error saving attendance logs: " + err.message, "error");
    } finally {
      setSavingLogs(false);
    }
  };

  return (
    <div className="attendance-marker">
      <div className="page-header">
        <div>
          <h1>Attendance Marker</h1>
          <p className="page-subtitle">Verify daily classroom attendance and log status</p>
        </div>
      </div>

      {/* Sheet target form card */}
      <form className="search-form glass-panel" onSubmit={handleLoadSheet}>
        <div className="form-grid">
          <div className="input-group">
            <label><Calendar size={14} /> Log Date</label>
            <input
              type="date"
              className="neon-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label><Layers size={14} /> Department</label>
            <select
              className="neon-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              required
            >
              {departments.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Year</label>
            <select
              className="neon-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              required
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>

          <div className="input-group">
            <label><BookOpen size={14} /> Subject</label>
            <select
              className="neon-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
            >
              {subjects.length === 0 ? (
                <option value="">No Subjects Found</option>
              ) : (
                subjects.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <button className="neon-btn neon-btn-primary fetch-btn" type="submit" disabled={loadingList}>
          {loadingList ? "Generating Sheet..." : "Load Attendance Sheet"}
        </button>
      </form>

      {/* Attendance Sheet Table card */}
      {hasLoadedList && (
        <div className="sheet-card glass-panel animate-fade-in">
          {students.length === 0 ? (
            <div className="no-students">
              <AlertCircle size={24} className="alert-icon" />
              <p>No students enrolled in this department/year branch.</p>
            </div>
          ) : (
            <>
              <div className="sheet-header">
                <div className="sheet-meta">
                  <h3>Marking Sheet</h3>
                  <span>{selectedSubject} • Year {selectedYear} • {students.length} students</span>
                </div>
                <div className="bulk-actions">
                  <button className="neon-btn neon-btn-secondary btn-sm text-green-btn" onClick={() => markAll("Present")}>
                    All Present
                  </button>
                  <button className="neon-btn neon-btn-secondary btn-sm text-red-btn" onClick={() => markAll("Absent")}>
                    All Absent
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="marking-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th className="status-col">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const status = attendanceMap[student._id] || "Present";
                      return (
                        <tr key={student._id}>
                          <td className="stud-id">{student.studentId}</td>
                          <td className="stud-name">{student.name}</td>
                          <td>
                            <div className="toggle-group">
                              <button
                                className={`toggle-btn present ${status === "Present" ? "active" : ""}`}
                                onClick={() => toggleStatus(student._id, "Present")}
                              >
                                <CheckCircle2 size={16} /> Present
                              </button>
                              <button
                                className={`toggle-btn absent ${status === "Absent" ? "active" : ""}`}
                                onClick={() => toggleStatus(student._id, "Absent")}
                              >
                                <XCircle size={16} /> Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="sheet-footer">
                <button
                  className="neon-btn neon-btn-primary save-btn"
                  onClick={handleSubmitAttendance}
                  disabled={savingLogs}
                >
                  {savingLogs ? "Saving Logs..." : "Submit Attendance Logs"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .attendance-marker {
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

        .search-form {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
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
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fetch-btn {
          align-self: flex-start;
          padding: 12px 24px;
        }

        .sheet-card {
          padding: 25px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }

        .no-students {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px 0;
          color: var(--text-muted);
        }

        .alert-icon {
          color: #f59e0b;
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .sheet-meta h3 {
          color: #fff;
          font-size: 18px;
        }

        .sheet-meta span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .bulk-actions {
          display: flex;
          gap: 10px;
        }

        .text-green-btn:hover {
          color: #10b981;
          border-color: #10b981;
        }

        .text-red-btn:hover {
          color: var(--neon-pink);
          border-color: var(--neon-pink);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .marking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .marking-table th {
          color: var(--text-muted);
          font-size: 13px;
          font-family: var(--font-display);
          font-weight: 600;
          padding: 12px;
          border-bottom: 1px solid var(--panel-border);
          text-transform: uppercase;
        }

        .marking-table td {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
          font-size: 14px;
        }

        .stud-id {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--neon-purple);
        }

        .stud-name {
          color: #fff;
          font-weight: 500;
        }

        .status-col {
          text-align: right;
        }

        .marking-table td:last-child {
          display: flex;
          justify-content: flex-end;
        }

        .toggle-group {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          padding: 2px;
        }

        .toggle-btn {
          border: none;
          background: none;
          color: var(--text-muted);
          padding: 6px 12px;
          font-size: 13px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: var(--transition-smooth);
        }

        .toggle-btn.present.active {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          text-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
        }

        .toggle-btn.absent.active {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-shadow: 0 0 5px rgba(239, 68, 68, 0.3);
        }

        .sheet-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid var(--panel-border);
        }

        .save-btn {
          padding: 12px 24px;
        }
      `}</style>
    </div>
  );
}
