import sys
import os
import json
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Fallback: if scikit-learn is not installed, we can mock the model predictions
try:
    from sklearn.linear_model import LinearRegression, LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from pymongo import MongoClient

def run_data_science():
    # 1. Connect to MongoDB
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/attendance_db")
    client = MongoClient(mongo_uri)
    db = client.get_database()

    # Fetch all students and attendance records
    students_cursor = db.students.find({})
    attendance_cursor = db.attendance.find({})

    students_list = list(students_cursor)
    attendance_list = list(attendance_cursor)

    # If no data is present, exit with empty template
    if not students_list or not attendance_list:
        empty_res = {
            "success": True,
            "overall_attendance": 0,
            "total_students": len(students_list),
            "stats_by_department": [],
            "stats_by_subject": [],
            "risk_predictions": [],
            "forecast": []
        }
        print(json.dumps(empty_res))
        return

    # Convert to pandas DataFrames
    df_students = pd.DataFrame(students_list)
    df_attendance = pd.DataFrame(attendance_list)

    # Clean student ID fields
    df_students['_id'] = df_students['_id'].astype(str)
    df_attendance['student'] = df_attendance['student'].astype(str)
    df_attendance['_id'] = df_attendance['_id'].astype(str)

    # Merge data
    df_merged = pd.merge(df_attendance, df_students, left_on='student', right_on='_id', suffixes=('_att', '_stud'))

    # Calculate overall stats
    total_records = len(df_merged)
    present_records = len(df_merged[df_merged['status'] == 'Present'])
    overall_percentage = (present_records / total_records) * 100 if total_records > 0 else 100.0

    # Department Statistics
    dept_stats = []
    for dept, group in df_merged.groupby('department_stud'):
        t = len(group)
        p = len(group[group['status'] == 'Present'])
        pct = (p / t) * 100 if t > 0 else 100.0
        dept_stats.append({
            "department": dept,
            "total": t,
            "present": p,
            "percentage": round(pct, 2)
        })

    # Subject Statistics
    sub_stats = []
    for sub, group in df_merged.groupby('subject'):
        t = len(group)
        p = len(group[group['status'] == 'Present'])
        pct = (p / t) * 100 if t > 0 else 100.0
        sub_stats.append({
            "subject": sub,
            "total": t,
            "present": p,
            "percentage": round(pct, 2)
        })

    # Predict Student Risk of falling below 75%
    # Prepare features for each student:
    # Features: current_rate, recent_rate, total_sessions
    student_features = []
    student_records = []

    # Sort attendance chronologically to calculate "recent" attendance rate
    df_merged['date_parsed'] = pd.to_datetime(df_merged['date'])
    df_merged = df_merged.sort_values(by='date_parsed')

    for s_idx, student in df_students.iterrows():
        s_id = student['_id']
        s_name = student['name']
        s_stud_id = student['studentId']
        s_dept = student['department']
        s_year = student['year']

        s_att = df_merged[df_merged['student'] == s_id]
        total_s = len(s_att)

        if total_s == 0:
            # Default values for students with no attendance
            student_features.append([1.0, 1.0, 0])
            student_records.append({
                "studentId": s_stud_id,
                "name": s_name,
                "department": s_dept,
                "year": s_year,
                "current_rate": 100.0,
                "recent_rate": 100.0,
                "total_sessions": 0,
                "risk_probability": 0.0,
                "risk_level": "Low",
                "recommendation": "No attendance marked yet."
            })
            continue

        p_s = len(s_att[s_att['status'] == 'Present'])
        curr_rate = p_s / total_s

        # Get last 10 records for recent rate
        recent_att = s_att.tail(10)
        recent_total = len(recent_att)
        recent_p = len(recent_att[recent_att['status'] == 'Present'])
        recent_rate = recent_p / recent_total if recent_total > 0 else curr_rate

        student_features.append([curr_rate, recent_rate, total_s])
        student_records.append({
            "studentId": s_stud_id,
            "name": s_name,
            "department": s_dept,
            "year": s_year,
            "current_rate": round(curr_rate * 100, 2),
            "recent_rate": round(recent_rate * 100, 2),
            "total_sessions": total_s
        })

    # ML Predictions using Scikit-Learn (or fallback JS/Python math if sklearn isn't available)
    features_arr = np.array(student_features)

    probabilities = []
    if SKLEARN_AVAILABLE and len(attendance_list) > 5:
        # Create synthetic training set to teach the model the "75% attendance threshold risk boundary"
        # Synthetic features: [current_rate, recent_rate, total_sessions]
        np.random.seed(42)
        syn_size = 300
        syn_curr = np.random.uniform(0.4, 1.0, syn_size)
        # recent rate is current rate + some shift (representing trend)
        syn_trend = np.random.normal(0, 0.1, syn_size)
        syn_recent = np.clip(syn_curr + syn_trend, 0.0, 1.0)
        syn_sessions = np.random.randint(5, 50, syn_size)

        # Labels: at risk (1) if final attendance is projected to be < 75%
        # Simple projection: final rate = 0.4 * syn_curr + 0.6 * syn_recent
        # If final rate < 0.75, then at_risk = 1
        projected = 0.3 * syn_curr + 0.7 * syn_recent
        syn_labels = (projected < 0.75).astype(int)

        X_train = np.column_stack((syn_curr, syn_recent, syn_sessions))
        y_train = syn_labels

        # Fit model
        model = LogisticRegression(solver='liblinear')
        model.fit(X_train, y_train)

        # Predict risk probabilities for actual students
        # The model returns classes [0, 1] where 1 is "At Risk" (falling below 75%)
        # Check model classes to find index of positive class
        pos_class_idx = list(model.classes_).index(1) if 1 in model.classes_ else 0
        probs_all = model.predict_proba(features_arr)
        probabilities = probs_all[:, pos_class_idx]
    else:
        # Heuristic/mathematical fallback
        for feat in features_arr:
            curr, recent, tot = feat
            # Project final attendance rate: weight recent trend heavier
            projected_final = 0.3 * curr + 0.7 * recent
            if projected_final < 0.75:
                # High risk probability depends on how far below 75% they are
                prob = min(1.0, (0.75 - projected_final) / 0.35 + 0.5)
            else:
                # Lower risk probability
                prob = max(0.0, 0.35 - (projected_final - 0.75) / 0.25)
            probabilities.append(prob)

    # Classify Risk Levels
    risk_results = []
    for idx, student_rec in enumerate(student_records):
        prob = float(probabilities[idx])
        student_rec["risk_probability"] = round(prob * 100, 2)

        # Assign risk category
        if prob >= 0.70:
            student_rec["risk_level"] = "High"
            student_rec["recommendation"] = "Immediate Academic Intervention & Parent Counseling required."
        elif prob >= 0.35:
            student_rec["risk_level"] = "Medium"
            student_rec["recommendation"] = "Issue warning warning email. Suggest peer mentoring sessions."
        else:
            student_rec["risk_level"] = "Low"
            student_rec["recommendation"] = "Keep up the excellent attendance. Continue normal routines."

        risk_results.append(student_rec)

    # Trend Forecasting (Linear Regression on aggregate daily attendance)
    # Group by date, get daily percentage
    daily_stats = []
    df_merged['date_str'] = df_merged['date_parsed'].dt.strftime('%Y-%m-%d')
    for date_str, group in df_merged.groupby('date_str'):
        t = len(group)
        p = len(group[group['status'] == 'Present'])
        pct = (p / t) * 100 if t > 0 else 0
        daily_stats.append({
            "date": date_str,
            "percentage": pct
        })

    # Sort daily stats
    daily_stats = sorted(daily_stats, key=lambda x: x['date'])

    forecast_results = []
    for d in daily_stats:
        forecast_results.append({
            "date": d['date'],
            "percentage": round(d['percentage'], 2),
            "type": "Historical"
        })

    if len(daily_stats) >= 2:
        # Train LinearRegression to predict future dates
        dates_parsed = [datetime.strptime(d['date'], '%Y-%m-%d') for d in daily_stats]
        start_date = min(dates_parsed)
        # X is days from start_date
        X = np.array([(d - start_date).days for d in dates_parsed]).reshape(-1, 1)
        y = np.array([d['percentage'] for d in daily_stats])

        model_lr = LinearRegression()
        model_lr.fit(X, y)

        # Forecast next 7 days
        last_date = max(dates_parsed)
        for i in range(1, 8):
            future_date = last_date + timedelta(days=i)
            future_days_diff = (future_date - start_date).days
            pred_val = model_lr.predict([[future_days_diff]])[0]
            # Clip between 0 and 100
            pred_val = max(0.0, min(100.0, float(pred_val)))
            forecast_results.append({
                "date": future_date.strftime('%Y-%m-%d'),
                "percentage": round(pred_val, 2),
                "type": "Forecast"
            })
    else:
        # Fallback if too few dates
        # Just duplicate last record or 75% projection for 7 days
        base_date = datetime.strptime(daily_stats[-1]['date'], '%Y-%m-%d') if daily_stats else datetime.now()
        base_pct = daily_stats[-1]['percentage'] if daily_stats else 75.0
        for i in range(1, 8):
            future_date = base_date + timedelta(days=i)
            forecast_results.append({
                "date": future_date.strftime('%Y-%m-%d'),
                "percentage": round(base_pct, 2),
                "type": "Forecast"
            })

    # Compile result
    result = {
        "success": True,
        "overall_attendance": round(overall_percentage, 2),
        "total_students": len(students_list),
        "stats_by_department": dept_stats,
        "stats_by_subject": sub_stats,
        "risk_predictions": risk_results,
        "forecast": forecast_results
    }

    print(json.dumps(result))

if __name__ == "__main__":
    run_data_science()
