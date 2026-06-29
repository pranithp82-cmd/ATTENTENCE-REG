import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="toast-icon text-success" size={20} />;
      case "error":
        return <XCircle className="toast-icon text-error" size={20} />;
      case "warning":
        return <AlertTriangle className="toast-icon text-warning" size={20} />;
      default:
        return <Info className="toast-icon text-info" size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast glass-panel toast-${toast.type}`}>
            <div className="toast-content">
              {getIcon(toast.type)}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          max-width: 380px;
          width: 100%;
        }

        .toast {
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px;
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: rgba(16, 15, 30, 0.85);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        @keyframes slide-in {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .toast-message {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
        }

        .toast-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }
        .toast-close:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        /* Colors */
        .toast-success {
          border-left: 4px solid #10b981 !important;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
        }
        .toast-error {
          border-left: 4px solid var(--neon-pink) !important;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
        }
        .toast-warning {
          border-left: 4px solid #f59e0b !important;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);
        }
        .toast-info {
          border-left: 4px solid var(--neon-blue) !important;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
        }

        .text-success { color: #10b981; filter: drop-shadow(0 0 4px #10b981); }
        .text-error { color: var(--neon-pink); filter: drop-shadow(0 0 4px var(--neon-pink)); }
        .text-warning { color: #f59e0b; filter: drop-shadow(0 0 4px #f59e0b); }
        .text-info { color: var(--neon-blue); filter: drop-shadow(0 0 4px var(--neon-blue)); }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
