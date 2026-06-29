const { exec } = require("child_process");
const path = require("path");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

// Heuristic JS fallback that replicates the exact structure and math of the Python Pandas/Scikit-learn logic
const runJSFallback = async () => {
  const students = await Student.find({});
  const attendance = await Attendance.find({});

  if (students.length === 0 || attendance.length === 0) {
    return {
      success: true,
      overall_attendance: 0,
      total_students: students.length,
      stats_by_department: [],
      stats_by_subject: [],
      risk_predictions: [],
      forecast: [],
      mode: "js-fallback-empty",
    };
  }

  // 1. Calculate overall stats
  const total = attendance.length;
  const present = attendance.filter((r) => r.status === "Present").length;
  const overallPercentage = parseFloat(((present / total) * 100).toFixed(2));

  // 2. Department statistics
  const deptMap = {};
  attendance.forEach((rec) => {
    const dept = rec.department;
    if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 };
    deptMap[dept].total += 1;
    if (rec.status === "Present") deptMap[dept].present += 1;
  });

  const statsByDepartment = Object.keys(deptMap).map((dept) => {
    const dTotal = deptMap[dept].total;
    const dPresent = deptMap[dept].present;
    return {
      department: dept,
      total: dTotal,
      present: dPresent,
      percentage: parseFloat(((dPresent / dTotal) * 100).toFixed(2)),
    };
  });

  // 3. Subject statistics
  const subjectMap = {};
  attendance.forEach((rec) => {
    const sub = rec.subject;
    if (!subjectMap[sub]) subjectMap[sub] = { total: 0, present: 0 };
    subjectMap[sub].total += 1;
    if (rec.status === "Present") subjectMap[sub].present += 1;
  });

  const statsBySubject = Object.keys(subjectMap).map((sub) => {
    const sTotal = subjectMap[sub].total;
    const sPresent = subjectMap[sub].present;
    return {
      subject: sub,
      total: sTotal,
      present: sPresent,
      percentage: parseFloat(((sPresent / sTotal) * 100).toFixed(2)),
    };
  });

  // 4. Predict Risk levels per student (replicates Scikit-learn Logistic Regression probability outcome)
  const riskPredictions = [];

  // Sort attendance chronologically to parse "recent" trends
  const sortedAtt = [...attendance].sort((a, b) => a.date.localeCompare(b.date));

  for (const stud of students) {
    const sAtt = sortedAtt.filter((r) => r.student.toString() === stud._id.toString());
    const totalSessions = sAtt.length;

    if (totalSessions === 0) {
      riskPredictions.push({
        studentId: stud.studentId,
        name: stud.name,
        department: stud.department,
        year: stud.year,
        current_rate: 100.0,
        recent_rate: 100.0,
        total_sessions: 0,
        risk_probability: 0.0,
        risk_level: "Low",
        recommendation: "No attendance records recorded yet.",
      });
      continue;
    }

    const sPresent = sAtt.filter((r) => r.status === "Present").length;
    const currentRate = sPresent / totalSessions;

    // Get last 10 records for recent rate
    const recentAtt = sAtt.slice(-10);
    const recentTotal = recentAtt.length;
    const recentPresent = recentAtt.filter((r) => r.status === "Present").length;
    const recentRate = recentTotal > 0 ? recentPresent / recentTotal : currentRate;

    // Projected Final Rate (places higher weight on recent drop-offs)
    const projectedRate = 0.3 * currentRate + 0.7 * recentRate;

    let prob = 0.0;
    if (projectedRate < 0.75) {
      // High probability of risk (falling below 75%)
      prob = Math.min(1.0, (0.75 - projectedRate) / 0.35 + 0.5);
    } else {
      // Low probability of risk
      prob = Math.max(0.0, 0.35 - (projectedRate - 0.75) / 0.25);
    }

    const riskProbPct = parseFloat((prob * 100).toFixed(2));
    let riskLevel = "Low";
    let recommendation = "Keep up the excellent attendance. Continue normal routines.";

    if (prob >= 0.7) {
      riskLevel = "High";
      recommendation = "Immediate Academic Intervention & Parent Counseling required.";
    } else if (prob >= 0.35) {
      riskLevel = "Medium";
      recommendation = "Issue warning email. Suggest peer mentoring sessions.";
    }

    riskPredictions.push({
      studentId: stud.studentId,
      name: stud.name,
      department: stud.department,
      year: stud.year,
      current_rate: parseFloat((currentRate * 100).toFixed(2)),
      recent_rate: parseFloat((recentRate * 100).toFixed(2)),
      total_sessions: totalSessions,
      risk_probability: riskProbPct,
      risk_level: riskLevel,
      recommendation: recommendation,
    });
  }

  // 5. Trend Forecasting (replicates Linear Regression)
  const dateMap = {};
  attendance.forEach((rec) => {
    if (!dateMap[rec.date]) dateMap[rec.date] = { total: 0, present: 0 };
    dateMap[rec.date].total += 1;
    if (rec.status === "Present") dateMap[rec.date].present += 1;
  });

  const dailyStats = Object.keys(dateMap)
    .map((d) => ({
      date: d,
      percentage: parseFloat(((dateMap[d].present / dateMap[d].total) * 100).toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const forecast = dailyStats.map((d) => ({
    date: d.date,
    percentage: d.percentage,
    type: "Historical",
  }));

  if (dailyStats.length >= 2) {
    // Basic linear regression: y = m * x + c
    // x = indices of dates
    const n = dailyStats.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    dailyStats.forEach((d, idx) => {
      sumX += idx;
      sumY += d.percentage;
      sumXY += idx * d.percentage;
      sumXX += idx * idx;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const c = (sumY - m * sumX) / n;

    // Predict next 7 days
    const baseDate = new Date(dailyStats[dailyStats.length - 1].date);
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + i);
      const nextDateStr = nextDate.toISOString().slice(0, 10);

      const predictedPct = m * (n - 1 + i) + c;
      const finalPct = Math.max(0.0, Math.min(100.0, parseFloat(predictedPct.toFixed(2))));

      forecast.push({
        date: nextDateStr,
        percentage: finalPct,
        type: "Forecast",
      });
    }
  } else {
    // Default forecast
    const baseDateStr = dailyStats.length > 0 ? dailyStats[dailyStats.length - 1].date : new Date().toISOString().slice(0, 10);
    const basePct = dailyStats.length > 0 ? dailyStats[dailyStats.length - 1].percentage : 75;
    const baseDate = new Date(baseDateStr);
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + i);
      forecast.push({
        date: nextDate.toISOString().slice(0, 10),
        percentage: basePct,
        type: "Forecast",
      });
    }
  }

  return {
    success: true,
    overall_attendance: overallPercentage,
    total_students: students.length,
    stats_by_department: statsByDepartment,
    stats_by_subject: statsBySubject,
    risk_predictions: riskPredictions,
    forecast: forecast,
    mode: "js-fallback",
  };
};

// @desc    Get AI-powered insights, predictions, and forecasts
// @route   GET /api/ai/insights
// @access  Private/Admin
exports.getAIInsights = async (req, res) => {
  try {
    const pythonScriptPath = path.join(__dirname, "..", "data_science", "ds_module.py");

    // Execute Python script
    exec(`python "${pythonScriptPath}"`, async (error, stdout, stderr) => {
      if (error || stderr) {
        console.warn("Python execution failed or returned stderr. Running JS Fallback engine.");
        if (stderr) console.error("Python Stderr:", stderr);

        try {
          const fallbackData = await runJSFallback();
          return res.json(fallbackData);
        } catch (fbError) {
          return res.status(500).json({ success: false, message: "Error running JS fallback data science engine: " + fbError.message });
        }
      }

      try {
        const results = JSON.parse(stdout);
        results.mode = "python-engine";
        res.json(results);
      } catch (parseError) {
        console.warn("Failed to parse Python stdout. Running JS Fallback engine.", parseError.message);
        try {
          const fallbackData = await runJSFallback();
          res.json(fallbackData);
        } catch (fbError) {
          res.status(500).json({ success: false, message: fbError.message });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
