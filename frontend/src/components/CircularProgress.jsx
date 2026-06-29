import React from "react";

export default function CircularProgress({ percentage = 0, size = 150, strokeWidth = 12, color = "purple" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColorHex = (name) => {
    switch (name) {
      case "blue":
        return "#3b82f6";
      case "pink":
        return "#ec4899";
      case "green":
        return "#10b981";
      default:
        return "#a855f7";
    }
  };

  const activeColor = getColorHex(color);

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Track circle */}
        <circle
          className="progress-track"
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated progress circle */}
        <circle
          className="progress-bar"
          stroke={activeColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: `drop-shadow(0 0 6px ${activeColor})`,
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />
      </svg>
      {/* Label overlays */}
      <div className="progress-label">
        <span className="percentage-text">{percentage}%</span>
        <span className="attendance-subtitle">Attendance</span>
      </div>

      <style>{`
        .circular-progress {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-bar {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }

        .progress-label {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .percentage-text {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          color: #fff;
        }

        .attendance-subtitle {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-top: -2px;
        }
      `}</style>
    </div>
  );
}
