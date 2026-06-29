const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

// Load models
const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Department = require("../models/Department");
const Subject = require("../models/Subject");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendance_db";
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding.");

    // Clear existing data
    await Admin.deleteMany({});
    await Student.deleteMany({});
    await Attendance.deleteMany({});
    await Department.deleteMany({});
    await Subject.deleteMany({});
    console.log("Cleared existing collections.");

    // 1. Create Admin
    const adminSalt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", adminSalt);
    await Admin.create({
      username: "admin",
      password: adminPassword,
      role: "admin",
    });
    console.log("Created Admin account: admin / admin123");

    // 2. Create Departments
    const departmentsData = [
      { name: "Computer Science", code: "CS" },
      { name: "Electrical Engineering", code: "EE" },
      { name: "Mechanical Engineering", code: "ME" },
      { name: "Information Technology", code: "IT" },
    ];
    const departments = await Department.insertMany(departmentsData);
    console.log(`Created ${departments.length} departments.`);

    // 3. Create Subjects
    const subjectsData = [
      // CS
      { name: "Data Structures", code: "CS101", department: "Computer Science" },
      { name: "Web Development", code: "CS102", department: "Computer Science" },
      { name: "Algorithms", code: "CS103", department: "Computer Science" },
      { name: "Database Systems", code: "CS104", department: "Computer Science" },
      { name: "Machine Learning", code: "CS105", department: "Computer Science" },
      // EE
      { name: "Signals and Systems", code: "EE101", department: "Electrical Engineering" },
      { name: "Power Systems", code: "EE102", department: "Electrical Engineering" },
      { name: "Control Systems", code: "EE103", department: "Electrical Engineering" },
      // ME
      { name: "Thermodynamics", code: "ME101", department: "Mechanical Engineering" },
      { name: "Fluid Mechanics", code: "ME102", department: "Mechanical Engineering" },
      { name: "Robotics", code: "ME103", department: "Mechanical Engineering" },
      // IT
      { name: "Cloud Computing", code: "IT101", department: "Information Technology" },
      { name: "Cyber Security", code: "IT102", department: "Information Technology" },
      { name: "Computer Networks", code: "IT103", department: "Information Technology" },
    ];
    const subjects = await Subject.insertMany(subjectsData);
    console.log(`Created ${subjects.length} subjects.`);

    // 4. Create Students (15 students)
    const studentSalt = await bcrypt.genSalt(10);
    const mockStudents = [
      // CS Students
      { name: "Alice Johnson", email: "alice@example.com", dept: "Computer Science", year: 1, idSeq: "001", prob: 0.95 }, // Diligent
      { name: "Bob Smith", email: "bob@example.com", dept: "Computer Science", year: 2, idSeq: "002", prob: 0.82 },    // Average
      { name: "Charlie Brown", email: "charlie@example.com", dept: "Computer Science", year: 3, idSeq: "003", prob: 0.55 }, // At-risk
      { name: "Diana Prince", email: "diana@example.com", dept: "Computer Science", year: 4, idSeq: "004", prob: 0.90 },  // Diligent
      { name: "Evan Wright", email: "evan@example.com", dept: "Computer Science", year: 2, idSeq: "005", prob: 0.72 },    // Borderline

      // EE Students
      { name: "Fiona Gallagher", email: "fiona@example.com", dept: "Electrical Engineering", year: 1, idSeq: "001", prob: 0.88 },
      { name: "George Costanza", email: "george@example.com", dept: "Electrical Engineering", year: 2, idSeq: "002", prob: 0.48 }, // At-risk
      { name: "Hannah Abbott", email: "hannah@example.com", dept: "Electrical Engineering", year: 3, idSeq: "003", prob: 0.96 },

      // ME Students
      { name: "Ian Malcolm", email: "ian@example.com", dept: "Mechanical Engineering", year: 1, idSeq: "001", prob: 0.76 },
      { name: "Julia Roberts", email: "julia@example.com", dept: "Mechanical Engineering", year: 4, idSeq: "002", prob: 0.92 },
      { name: "Kevin Bacon", email: "kevin@example.com", dept: "Mechanical Engineering", year: 2, idSeq: "003", prob: 0.52 }, // At-risk

      // IT Students
      { name: "Luna Lovegood", email: "luna@example.com", dept: "Information Technology", year: 1, idSeq: "001", prob: 0.91 },
      { name: "Monty Python", email: "monty@example.com", dept: "Information Technology", year: 2, idSeq: "002", prob: 0.80 },
      { name: "Nancy Drew", email: "nancy@example.com", dept: "Information Technology", year: 3, idSeq: "003", prob: 0.62 }, // At-risk
      { name: "Oscar Wilde", email: "oscar@example.com", dept: "Information Technology", year: 4, idSeq: "004", prob: 0.94 },
    ];

    const currentYearStr = new Date().getFullYear().toString();
    const studentsCreated = [];

    for (const s of mockStudents) {
      const deptCode = departments.find((d) => d.name === s.dept).code;
      const studentId = `${deptCode}${currentYearStr}${s.idSeq}`;
      const password = await bcrypt.hash(`Temp@${studentId}`, studentSalt);

      const stud = await Student.create({
        studentId,
        name: s.name,
        email: s.email,
        password,
        department: s.dept,
        year: s.year,
        isPasswordResetRequired: true, // will force password reset on first login
      });
      studentsCreated.push({ ...stud.toObject(), targetProb: s.prob });
    }
    console.log(`Created ${studentsCreated.length} mock students.`);

    // 5. Create 30 Days of Historical Attendance
    // Generate dates: last 30 days
    const attendanceRecords = [];
    const subjectsList = subjects;

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().slice(0, 10);

      // For each student, mark attendance for 1-2 subjects that day
      for (const student of studentsCreated) {
        // Find subjects belonging to their department
        const deptSubjects = subjectsList.filter((s) => s.department === student.department);
        if (deptSubjects.length === 0) continue;

        // Choose up to 2 subjects
        const todaySubjects = deptSubjects.slice(0, 2);

        for (const subject of todaySubjects) {
          // Determine status based on student's attendance probability
          // To simulate recent drop-off for at-risk students, we reduce their probability
          // if we are in the last 10 days of the logs!
          let attendanceProb = student.targetProb;
          if (student.targetProb < 0.70 && dayOffset < 10) {
            attendanceProb -= 0.15; // drop off in attendance recently
          }

          const status = Math.random() < attendanceProb ? "Present" : "Absent";

          attendanceRecords.push({
            student: student._id,
            date: dateStr,
            department: student.department,
            year: student.year,
            subject: subject.name,
            status,
            recordedBy: "admin",
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`Successfully generated ${attendanceRecords.length} historical attendance logs.`);
    console.log("Seeding complete! Database is ready.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
