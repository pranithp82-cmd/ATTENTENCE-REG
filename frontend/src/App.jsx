import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider as CustomToastProvider } from "./components/Toast";
import Landing from "./pages/Landing";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
import StudentManagement from "./pages/StudentManagement";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import AIInsights from "./pages/AIInsights";
import StudentDashboard from "./pages/StudentDashboard";

// Sub-wrapper to access AuthContext hooks safely
function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const navigate = useNavigate();

  // Redirect on user change
  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  // If student has a password reset requirement, force view to password update
  useEffect(() => {
    if (user && user.role === "student" && user.isPasswordResetRequired) {
      setCurrentView("password");
    } else {
      setCurrentView("dashboard");
    }
  }, [user]);

  if (loading) {
    return (
      <div className="app-global-loader">
        <div className="spinner"></div>
        <p>ERA System Loading...</p>
        <style>{`
          .app-global-loader {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #0a0914;
            gap: 15px;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(168, 85, 247, 0.1);
            border-top-color: var(--neon-purple);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            filter: drop-shadow(0 0 10px var(--neon-purple));
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Active view router mapping for Admin Dashboard
  const renderAdminView = () => {
    switch (currentView) {
      case "dashboard":
        return <AdminDashboard setCurrentView={setCurrentView} />;
      case "students":
        return <StudentManagement />;
      case "attendance":
        return <MarkAttendance />;
      case "history":
        return <AttendanceHistory />;
      case "ai":
        return <AIInsights />;
      default:
        return <AdminDashboard setCurrentView={setCurrentView} />;
    }
  };

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/" element={<Landing />} />

      {/* Authenticated Workspace Route */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <div className="dashboard-layout">
              {/* Common Sidebar */}
              <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

              {/* Main Workspace Frame */}
              <main className="dashboard-content">
                {user.role === "admin" ? (
                  renderAdminView()
                ) : (
                  <StudentDashboard currentView={currentView} setCurrentView={setCurrentView} />
                )}
              </main>
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Wildcard Catchall */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <CustomToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </CustomToastProvider>
  );
}
