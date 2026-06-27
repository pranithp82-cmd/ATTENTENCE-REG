// Student Attendance System
// This file handles adding students, marking attendance, filtering, editing,
// deleting, saving to Local Storage, and exporting CSV files.

const STORAGE_KEY = "student-attendance-system";
const STATUS = {
  PRESENT: "present",
  ABSENT: "absent"
};

const currentDate = document.querySelector("#current-date");
const studentForm = document.querySelector("#student-form");
const studentIdInput = document.querySelector("#student-id");
const studentNameInput = document.querySelector("#student-name");
const formTitle = document.querySelector("#form-title");
const formButtonText = document.querySelector("#form-button-text");
const cancelEditButton = document.querySelector("#cancel-edit");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const saveButton = document.querySelector("#save-attendance");
const exportButton = document.querySelector("#export-csv");
const resetButton = document.querySelector("#reset-attendance");
const tableBody = document.querySelector("#attendance-body");
const emptyState = document.querySelector("#empty-state");
const totalCount = document.querySelector("#total-count");
const presentCount = document.querySelector("#present-count");
const absentCount = document.querySelector("#absent-count");
const modal = document.querySelector("#confirm-modal");
const modalTitle = document.querySelector("#modal-title");
const modalMessage = document.querySelector("#modal-message");
const cancelDeleteButton = document.querySelector("#cancel-delete");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const toast = document.querySelector("#toast");

const todayKey = getTodayKey();
let state = loadState();
let students = Array.isArray(state.students) ? state.students : [];
let attendance = state.attendance || {};
let pendingConfirmAction = null;
let toastTimer = null;

currentDate.textContent = formatDisplayDate(todayKey);
ensureTodayAttendance();
saveState();
render();

studentForm.addEventListener("submit", handleStudentSubmit);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
saveButton.addEventListener("click", saveAttendance);
exportButton.addEventListener("click", exportAttendanceToCsv);
resetButton.addEventListener("click", openResetConfirmation);
tableBody.addEventListener("click", handleTableClick);
cancelDeleteButton.addEventListener("click", closeModal);
confirmDeleteButton.addEventListener("click", runConfirmedAction);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Adds a new student or updates an existing student name.
function handleStudentSubmit(event) {
  event.preventDefault();

  const name = studentNameInput.value.trim();
  const editingId = studentIdInput.value;

  if (!name) {
    studentNameInput.focus();
    return;
  }

  if (editingId) {
    const student = students.find((item) => item.id === editingId);
    if (student) {
      student.name = name;
      showToast("Student updated successfully.");
    }
  } else {
    const student = {
      id: createId(),
      name
    };
    students.push(student);
    attendance[todayKey][student.id] = STATUS.ABSENT;
    showToast("Student added successfully.");
  }

  saveState();
  resetForm();
  render();
}

// Handles mark, edit, and delete buttons inside the attendance table.
function handleTableClick(event) {
  const markButton = event.target.closest("[data-status]");
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (markButton) {
    setAttendance(markButton.dataset.id, markButton.dataset.status);
    return;
  }

  if (editButton) {
    startEditStudent(editButton.dataset.edit);
    return;
  }

  if (deleteButton) {
    openDeleteConfirmation(deleteButton.dataset.delete);
  }
}

function setAttendance(studentId, status) {
  attendance[todayKey][studentId] = status;
  saveState();
  render();
}

function startEditStudent(studentId) {
  const student = students.find((item) => item.id === studentId);
  if (!student) {
    return;
  }

  studentIdInput.value = student.id;
  studentNameInput.value = student.name;
  formTitle.textContent = "Edit Student";
  formButtonText.textContent = "Update Student";
  cancelEditButton.classList.remove("hidden");
  studentNameInput.focus();
}

function openDeleteConfirmation(studentId) {
  const student = students.find((item) => item.id === studentId);
  if (!student) {
    return;
  }

  modalTitle.textContent = "Delete student?";
  modalMessage.textContent = `Delete ${student.name} from the attendance list?`;
  confirmDeleteButton.textContent = "Delete";
  pendingConfirmAction = () => deleteStudent(studentId);
  modal.classList.remove("hidden");
}

function openResetConfirmation() {
  modalTitle.textContent = "Reset attendance?";
  modalMessage.textContent = "All students will be marked Absent for today.";
  confirmDeleteButton.textContent = "Reset";
  pendingConfirmAction = resetTodayAttendance;
  modal.classList.remove("hidden");
}

function runConfirmedAction() {
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  closeModal();
}

function closeModal() {
  modal.classList.add("hidden");
  pendingConfirmAction = null;
}

function deleteStudent(studentId) {
  students = students.filter((student) => student.id !== studentId);

  Object.values(attendance).forEach((dayAttendance) => {
    delete dayAttendance[studentId];
  });

  saveState();
  resetForm();
  render();
  showToast("Student deleted successfully.");
}

function resetTodayAttendance() {
  students.forEach((student) => {
    attendance[todayKey][student.id] = STATUS.ABSENT;
  });

  saveState();
  render();
  showToast("Attendance reset successfully.");
}

function saveAttendance() {
  saveState();
  showToast("Attendance saved successfully.");
}

// Creates and downloads a CSV file for today's attendance list.
function exportAttendanceToCsv() {
  if (students.length === 0) {
    showToast("No records available to export.");
    return;
  }

  const rows = [
    ["Date", "Student Name", "Attendance Status"],
    ...students.map((student) => [
      formatDisplayDate(todayKey),
      student.name,
      toLabel(getAttendance(student.id))
    ])
  ];

  const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `attendance-${todayKey}.csv`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast("CSV file exported successfully.");
}

function render() {
  ensureTodayAttendance();
  renderSummary();
  renderTable();
}

function renderSummary() {
  const statuses = students.map((student) => getAttendance(student.id));

  totalCount.textContent = students.length;
  presentCount.textContent = statuses.filter((status) => status === STATUS.PRESENT).length;
  absentCount.textContent = statuses.filter((status) => status === STATUS.ABSENT).length;
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(query);
    const status = getAttendance(student.id);
    const matchesFilter = filter === "all" || status === filter;
    return matchesSearch && matchesFilter;
  });

  tableBody.innerHTML = "";
  emptyState.classList.toggle("visible", filteredStudents.length === 0);

  filteredStudents.forEach((student) => {
    tableBody.append(createStudentRow(student));
  });
}

function createStudentRow(student) {
  const status = getAttendance(student.id);
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>
      <div class="student-cell">
        <span class="student-avatar">${escapeHtml(student.name.charAt(0) || "S")}</span>
        <span class="student-name">${escapeHtml(student.name)}</span>
      </div>
    </td>
    <td>
      <div class="status-actions">
        <button class="status-btn present ${status === STATUS.PRESENT ? "active" : ""}" type="button" data-id="${student.id}" data-status="${STATUS.PRESENT}" aria-pressed="${status === STATUS.PRESENT}">
          ${svgIcon("icon-check")} Present
        </button>
        <button class="status-btn absent ${status === STATUS.ABSENT ? "active" : ""}" type="button" data-id="${student.id}" data-status="${STATUS.ABSENT}" aria-pressed="${status === STATUS.ABSENT}">
          ${svgIcon("icon-close")} Absent
        </button>
      </div>
    </td>
    <td><span class="badge ${status}">${toLabel(status)}</span></td>
    <td>
      <div class="row-actions">
        <button class="icon-btn edit" type="button" data-edit="${student.id}" aria-label="Edit ${escapeHtml(student.name)}">
          ${svgIcon("icon-edit")}
        </button>
        <button class="icon-btn delete" type="button" data-delete="${student.id}" aria-label="Delete ${escapeHtml(student.name)}">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    </td>
  `;

  return row;
}

function resetForm() {
  studentIdInput.value = "";
  studentNameInput.value = "";
  formTitle.textContent = "Add Student";
  formButtonText.textContent = "Add Student";
  cancelEditButton.classList.add("hidden");
}

function ensureTodayAttendance() {
  attendance[todayKey] = attendance[todayKey] || {};

  students.forEach((student) => {
    if (!attendance[todayKey][student.id]) {
      attendance[todayKey][student.id] = STATUS.ABSENT;
    }
  });
}

function getAttendance(studentId) {
  return attendance[todayKey]?.[studentId] || STATUS.ABSENT;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, attendance }));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full"
  }).format(new Date(`${dateKey}T00:00:00`));
}

function toLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toCsvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function svgIcon(id) {
  return `<svg class="icon" aria-hidden="true"><use href="#${id}"></use></svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
