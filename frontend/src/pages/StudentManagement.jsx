import React, { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import { Search, Plus, Edit2, Trash2, RotateCcw, Copy, Check } from "lucide-react";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");

  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // New Student Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState(1);
  const [formLoading, setFormLoading] = useState(false);

  // Result overlay after creation / reset
  const [credentialsModal, setCredentialsModal] = useState(null); // { studentId, tempPassword, action: 'create' | 'reset', name }

  // Delete Confirm Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [copied, setCopied] = useState(false);

  const { showToast } = useToast();

  // Fetch Departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/misc/departments");
        setDepartments(res.data);
        if (res.data.length > 0) {
          setDepartment(res.data[0].name);
        }
      } catch (err) {
        showToast("Failed to load departments: " + err.message, "error");
      }
    };
    fetchDepts();
  }, [showToast]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/students?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (deptFilter !== "All") query += `&department=${encodeURIComponent(deptFilter)}`;
      if (yearFilter !== "All") query += `&year=${yearFilter}`;

      const res = await api.get(query);
      setStudents(res.data);
      setPages(res.pages);
      setTotal(res.total);
    } catch (err) {
      showToast("Error loading students: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, yearFilter, showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handle Search Input Change (Reset page)
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Handle Filters Change
  const handleDeptFilterChange = (e) => {
    setDeptFilter(e.target.value);
    setPage(1);
  };

  const handleYearFilterChange = (e) => {
    setYearFilter(e.target.value);
    setPage(1);
  };

  // Add Student Handler
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name || !email || !department || !year) {
      showToast("Please enter all fields", "warning");
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.post("/students", { name, email, department, year });
      if (res.success) {
        showToast("Student created successfully", "success");
        setShowAddForm(false);
        setName("");
        setEmail("");
        setYear(1);
        
        // Show credentials popup
        setCredentialsModal({
          name: res.student.name,
          studentId: res.student.studentId,
          tempPassword: res.student.temporaryPassword,
          action: "create",
        });
        
        fetchStudents();
      }
    } catch (err) {
      showToast(err.message || "Failed to create student", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Student Handler
  const handleEditStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent.name || !selectedStudent.email || !selectedStudent.department || !selectedStudent.year) {
      showToast("Please enter all fields", "warning");
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.put(`/students/${selectedStudent._id}`, {
        name: selectedStudent.name,
        email: selectedStudent.email,
        department: selectedStudent.department,
        year: selectedStudent.year,
      });
      if (res.success) {
        showToast("Student record updated", "success");
        setShowEditForm(false);
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (err) {
      showToast(err.message || "Failed to edit student", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Password Reset Handler
  const handleResetPassword = async (student) => {
    try {
      const res = await api.post(`/students/${student._id}/reset-password`);
      if (res.success) {
        showToast(`Password reset completed for ${student.name}`, "success");
        setCredentialsModal({
          name: student.name,
          studentId: student.studentId,
          tempPassword: res.temporaryPassword,
          action: "reset",
        });
      }
    } catch (err) {
      showToast("Password reset failed: " + err.message, "error");
    }
  };

  // Delete Student Handler
  const handleDeleteStudent = async () => {
    try {
      const res = await api.delete(`/students/${deleteConfirmId}`);
      if (res.success) {
        showToast("Student record deleted successfully", "success");
        setDeleteConfirmId(null);
        // adjust page if deleting last student on page
        if (students.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchStudents();
        }
      }
    } catch (err) {
      showToast("Deletion failed: " + err.message, "error");
    }
  };

  // Clipboard Copier helper
  const copyCredentials = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    showToast("Credentials copied to clipboard!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="students-manager">
      <div className="page-header">
        <div>
          <h1>Student Registrar</h1>
          <p className="page-subtitle">Manage, create, and search student enrollment archives</p>
        </div>
        <button className="neon-btn neon-btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Filter and Search capsule */}
      <div className="filter-capsule glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="neon-input"
            type="text"
            placeholder="Search name or student ID..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filters-right">
          <div className="filter-select-group">
            <label>Dept</label>
            <select className="neon-select" value={deptFilter} onChange={handleDeptFilterChange}>
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label>Year</label>
            <select className="neon-select" value={yearFilter} onChange={handleYearFilterChange}>
              <option value="All">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="table-wrapper glass-panel">
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Accessing registrar database...</p>
          </div>
        ) : students.length === 0 ? (
          <p className="no-data">No student matches found.</p>
        ) : (
          <>
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th className="actions-header">Operations</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <span className="student-id-badge">{student.studentId}</span>
                    </td>
                    <td className="student-name">{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.department}</td>
                    <td>Year {student.year}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-icon-btn edit"
                          title="Edit Student"
                          onClick={() => {
                            setSelectedStudent({ ...student });
                            setShowEditForm(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn reset"
                          title="Reset Password"
                          onClick={() => handleResetPassword(student)}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          title="Delete Student"
                          onClick={() => setDeleteConfirmId(student._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing page {page} of {pages} ({total} total students)
              </span>
              <div className="pagination-buttons">
                <button
                  className="neon-btn neon-btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button
                  className="neon-btn neon-btn-secondary btn-sm"
                  disabled={page === pages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 1. Add Student Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <form className="modal-content glass-panel form-modal" onSubmit={handleAddStudent}>
            <h2>Register New Student</h2>
            <p className="form-desc">Generates a unique Student ID automatically.</p>

            <div className="input-group">
              <label>Full Name</label>
              <input
                className="neon-input"
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                className="neon-input"
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group flex-1">
                <label>Department</label>
                <select
                  className="neon-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
                <label>Academic Year</label>
                <select
                  className="neon-select"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  required
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="neon-btn neon-btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setName("");
                  setEmail("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="neon-btn neon-btn-primary" disabled={formLoading}>
                {formLoading ? "Creating..." : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Student Modal */}
      {showEditForm && selectedStudent && (
        <div className="modal-overlay">
          <form className="modal-content glass-panel form-modal" onSubmit={handleEditStudent}>
            <h2>Edit Student Profile</h2>
            <span className="student-id-display">ID: {selectedStudent.studentId}</span>

            <div className="input-group">
              <label>Full Name</label>
              <input
                className="neon-input"
                type="text"
                value={selectedStudent.name}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                className="neon-input"
                type="email"
                value={selectedStudent.email}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group flex-1">
                <label>Department</label>
                <select
                  className="neon-select"
                  value={selectedStudent.department}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, department: e.target.value })}
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
                <label>Academic Year</label>
                <select
                  className="neon-select"
                  value={selectedStudent.year}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, year: parseInt(e.target.value, 10) })}
                  required
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="neon-btn neon-btn-secondary"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="neon-btn neon-btn-primary" disabled={formLoading}>
                {formLoading ? "Saving..." : "Save Edits"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Credentials Display Modal (Glow card overlay for temporary passcodes) */}
      {credentialsModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel creds-modal">
            <h2 className="creds-title">
              {credentialsModal.action === "create" ? "Student Account Created" : "Password Reset Completed"}
            </h2>
            <p className="creds-desc">Provide these credentials to student: <strong>{credentialsModal.name}</strong></p>

            <div className="creds-capsule">
              <div className="cred-field">
                <span className="cred-label">STUDENT ID</span>
                <span className="cred-val">{credentialsModal.studentId}</span>
              </div>
              <div className="cred-field">
                <span className="cred-label">TEMPORARY PASSWORD</span>
                <span className="cred-val font-mono">{credentialsModal.tempPassword}</span>
              </div>
            </div>

            <div className="creds-actions">
              <button
                className="neon-btn neon-btn-secondary"
                onClick={() => copyCredentials(`Student ID: ${credentialsModal.studentId}\nPassword: ${credentialsModal.tempPassword}`)}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Credentials"}
              </button>
              <button
                className="neon-btn neon-btn-primary"
                onClick={() => setCredentialsModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        title="Delete Student?"
        message="Warning: This action will permanently remove the student profile and erase all associated attendance records from the archives. This process cannot be undone."
        confirmText="Erase Student"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <style>{`
        .students-manager {
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

        .filter-capsule {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 320px;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .search-box input {
          width: 100%;
          padding-left: 38px !important;
        }

        .filters-right {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-select-group label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .table-wrapper {
          padding: 20px;
          overflow-x: auto;
        }

        .student-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .student-table th {
          color: var(--text-muted);
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 15px 12px;
          border-bottom: 1px solid var(--panel-border);
        }

        .student-table td {
          padding: 16px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
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
          text-shadow: 0 0 5px rgba(168, 85, 247, 0.3);
        }

        .student-name {
          color: #fff;
          font-weight: 500;
        }

        .table-actions {
          display: flex;
          gap: 8px;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .action-icon-btn.edit:hover {
          color: var(--neon-blue);
          border-color: var(--neon-blue);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.05);
        }

        .action-icon-btn.reset:hover {
          color: var(--neon-purple);
          border-color: var(--neon-purple);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
          background: rgba(168, 85, 247, 0.05);
        }

        .action-icon-btn.delete:hover {
          color: var(--neon-pink);
          border-color: var(--neon-pink);
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);
          background: rgba(236, 72, 153, 0.05);
        }

        .actions-header {
          text-align: right;
        }

        .student-table td:last-child {
          display: flex;
          justify-content: flex-end;
        }

        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid var(--panel-border);
        }

        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
        }

        .pagination-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        /* Modal specific styling overrides */
        .form-modal {
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-modal h2 {
          color: #fff;
          font-size: 22px;
        }

        .form-desc {
          color: var(--text-muted);
          font-size: 13px;
          margin-top: -10px;
        }

        .student-id-display {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--neon-purple);
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
          padding: 4px 10px;
          border-radius: 4px;
          align-self: flex-start;
          margin-top: -10px;
        }

        .input-row {
          display: flex;
          gap: 15px;
        }

        .flex-1 {
          flex: 1;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        /* Credentials display overlay design */
        .creds-modal {
          max-width: 480px;
          text-align: center;
          padding: 35px 25px;
        }

        .creds-title {
          font-size: 22px;
          color: #fff;
          margin-bottom: 8px;
        }

        .creds-desc {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 20px;
        }

        .creds-capsule {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--panel-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 25px;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.4);
        }

        .cred-field {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .cred-label {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .cred-val {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }

        .font-mono {
          font-family: monospace;
          color: var(--neon-blue);
          text-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
        }

        .creds-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
      `}</style>
    </div>
  );
}
