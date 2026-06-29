import React from "react";

export default function Card({ title, value, icon: Icon, trend, trendType, color = "purple" }) {
  const cardClass = `card glass-panel glass-card-${color}`;

  return (
    <div className={cardClass}>
      <div className="card-header">
        <span className="card-title">{title}</span>
        {Icon && <Icon size={22} className={`card-icon text-${color}`} />}
      </div>
      <div className="card-body">
        <h3 className="card-value">{value}</h3>
        {trend && (
          <div className={`card-trend ${trendType || "positive"}`}>
            <span className="trend-arrow">{trendType === "negative" ? "↓" : "↑"}</span>
            <span className="trend-text">{trend}</span>
          </div>
        )}
      </div>

      <style>{`
        .card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .card-icon {
          opacity: 0.8;
          filter: drop-shadow(0 0 5px currentColor);
        }

        .text-purple {
          color: var(--neon-purple);
        }
        .text-blue {
          color: var(--neon-blue);
        }
        .text-pink {
          color: var(--neon-pink);
        }

        .card-value {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          font-family: var(--font-display);
        }

        .card-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 5px;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .card-trend.positive {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .card-trend.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}
