import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-float-short">
        <div className="modal-header">
          <AlertTriangle className={`modal-icon text-${type}`} size={32} />
          <h2>{title}</h2>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="neon-btn neon-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`neon-btn ${type === "danger" ? "neon-btn-pink" : "neon-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 4, 10, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          max-width: 450px;
          width: 100%;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        @keyframes float-short {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-float-short {
          animation: float-short 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .modal-header h2 {
          font-size: 22px;
          color: #fff;
        }

        .modal-icon.text-danger {
          color: var(--neon-pink);
          filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.5));
        }

        .modal-icon.text-warning {
          color: #f59e0b;
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
        }

        .modal-body p {
          color: var(--text-muted);
          font-size: 15px;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}
