import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import logoImage from "../assets/cpu-college-logo.svg";
import { useAuth } from "../context/AuthContext";

const ROLE_MENUS = {
  student: [
    { key: "dashboard", label: "Dashboard" },
    { key: "attendance", label: "Attendance" },
    { key: "results", label: "Results" },
    { key: "timetable", label: "Timetable" },
  ],
  teacher: [
    { key: "dashboard", label: "Dashboard" },
    { key: "mark-attendance", label: "Mark Attendance" },
    { key: "enter-grades", label: "Enter Grades" },
    { key: "my-courses", label: "My Courses" },
  ],
  registrar: [
    { key: "dashboard", label: "Dashboard" },
    { key: "register-student", label: "Register Student" },
    { key: "register-teacher", label: "Register Teacher" },
    { key: "timetable", label: "Timetable" },
    { key: "exam-schedule", label: "Exam Schedule" },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "user-management", label: "User Management" },
    { key: "system-settings", label: "System Settings" },
    { key: "monitoring", label: "Monitoring" },
  ],
};

function getTodayKey() {
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return names[new Date().getDay()];
}

function buildCsv(rows, headers) {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [headers.join(",")];
  rows.forEach((row) => lines.push(headers.map((header) => escapeCell(row[header])).join(",")));
  return lines.join("\n");
}

function downloadCsv(fileName, rows, headers) {
  const blob = new Blob([buildCsv(rows, headers)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function scoreToGrade(mark) {
  const numeric = Number(mark);
  if (numeric >= 85) return { grade: "A", gpa: 4.0 };
  if (numeric >= 75) return { grade: "B", gpa: 3.5 };
  if (numeric >= 65) return { grade: "C", gpa: 3.0 };
  if (numeric >= 50) return { grade: "D", gpa: 2.0 };
  return { grade: "F", gpa: 0.0 };
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);

  const [actionLogs, setActionLogs] = useState([]);
  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem("admin_settings");
    if (!raw) {
      return { notifications: true, strictSecurity: true, maintenanceMode: false };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { notifications: true, strictSecurity: true, maintenanceMode: false };
    }
  });

  const [attendanceForm, setAttendanceForm] = useState({ course: "", student: "", date: "", status: "present" });
  const [resultForm, setResultForm] = useState({ course: "", student: "", mark: "", term: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "student",
  });
  const [timetableForm, setTimetableForm] = useState({
    term: "",
    day: "monday",
    start_time: "09:00",
    end_time: "10:00",
    room: "",
    course: "",
    published: true,
  });

  const role = user?.role || "student";
  const roleLabel = { student: "Student", teacher: "Teacher", registrar: "Registrar", admin: "Administrator" }[role] || "User";

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setActionLogs((prev) => [{ time, message }, ...prev].slice(0, 30));
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const requests = [
      api.get("/courses/items/"),
      api.get("/attendance/records/"),
      api.get("/results/items/"),
      api.get("/timetable/entries/"),
      api.get("/courses/enrollments/"),
    ];
    if (["registrar", "admin"].includes(role)) {
      requests.push(api.get("/users/list/"));
    }

    const [coursesRes, attendanceRes, resultsRes, timetableRes, enrollmentsRes, usersRes] = await Promise.allSettled(requests);

    setCourses(coursesRes.status === "fulfilled" ? coursesRes.value.data : []);
    setAttendance(attendanceRes.status === "fulfilled" ? attendanceRes.value.data : []);
    setResults(resultsRes.status === "fulfilled" ? resultsRes.value.data : []);
    setTimetable(timetableRes.status === "fulfilled" ? timetableRes.value.data : []);
    setEnrollments(enrollmentsRes.status === "fulfilled" ? enrollmentsRes.value.data : []);
    setUsers(usersRes?.status === "fulfilled" ? usersRes.value.data : []);
    setLoading(false);
  };

  useEffect(() => {
    setActiveSection("dashboard");
  }, [role]);

  useEffect(() => {
    loadData().catch(() => {
      setNotice("Failed to load dashboard data.");
      setLoading(false);
    });
  }, [user?.id, role]);

  const enrolledCourseIds = useMemo(() => new Set(enrollments.map((item) => item.course)), [enrollments]);

  const visibleCourses = useMemo(() => {
    if (role === "teacher") {
      return courses.filter((course) => course.teacher === user?.id);
    }
    if (role === "student") {
      return courses.filter((course) => enrolledCourseIds.has(course.id));
    }
    return courses;
  }, [courses, role, user?.id, enrolledCourseIds]);

  const visibleTimetable = useMemo(() => {
    if (role === "student" && enrolledCourseIds.size) {
      return timetable.filter((item) => enrolledCourseIds.has(item.course));
    }
    if (role === "teacher") {
      const teachingCourseIds = new Set(visibleCourses.map((item) => item.id));
      return timetable.filter((item) => teachingCourseIds.has(item.course));
    }
    return timetable;
  }, [role, timetable, enrolledCourseIds, visibleCourses]);

  const todayClasses = useMemo(() => {
    const today = getTodayKey();
    return visibleTimetable.filter((item) => item.day === today);
  }, [visibleTimetable]);

  const attendancePercentage = useMemo(() => {
    if (!attendance.length) return 0;
    const attended = attendance.filter((item) => ["present", "late", "excused"].includes(item.status)).length;
    return Math.round((attended / attendance.length) * 1000) / 10;
  }, [attendance]);

  const studentCgpa = useMemo(() => {
    if (!results.length) return 0;
    const total = results.reduce((sum, item) => sum + Number(item.gpa || 0), 0);
    return Math.round((total / results.length) * 100) / 100;
  }, [results]);

  const teacherStudents = useMemo(() => {
    const courseIds = new Set(visibleCourses.map((item) => item.id));
    const map = new Map();
    enrollments.forEach((item) => {
      if (courseIds.has(item.course) && !map.has(item.student)) {
        map.set(item.student, { id: item.student, name: item.student_name });
      }
    });
    return [...map.values()];
  }, [visibleCourses, enrollments]);

  const pendingOwnResults = useMemo(() => {
    if (role !== "teacher") return [];
    const courseIds = new Set(visibleCourses.map((item) => item.id));
    return results.filter((item) => courseIds.has(item.course) && !item.published);
  }, [role, results, visibleCourses]);

  const registrarConflicts = useMemo(() => {
    const seen = [];
    const clashes = [];
    timetable.forEach((item) => {
      const sameRoom = seen.filter((entry) => entry.day === item.day && entry.room.toLowerCase() === item.room.toLowerCase());
      sameRoom.forEach((entry) => {
        const overlap = !(item.end_time <= entry.start_time || item.start_time >= entry.end_time);
        if (overlap) {
          clashes.push(`${item.day} ${item.room} (${entry.course_code} and ${item.course_code})`);
        }
      });
      seen.push(item);
    });
    return clashes;
  }, [timetable]);

  const summaryCards = useMemo(() => {
    if (role === "student") {
      return [
        { label: "Attendance", value: `${attendancePercentage}%` },
        { label: "CGPA", value: studentCgpa || "0.00" },
        { label: "Enrolled", value: enrollments.length },
        { label: "Classes Today", value: todayClasses.length },
      ];
    }
    if (role === "teacher") {
      return [
        { label: "Students", value: teacherStudents.length },
        { label: "Courses", value: visibleCourses.length },
        { label: "Classes Today", value: todayClasses.length },
        { label: "Pending Tasks", value: pendingOwnResults.length },
      ];
    }
    if (role === "registrar") {
      return [
        { label: "Total Students", value: users.filter((item) => item.role === "student").length },
        { label: "Total Teachers", value: users.filter((item) => item.role === "teacher").length },
        { label: "Courses", value: courses.length },
        { label: "Pending Reqs", value: results.filter((item) => !item.published).length },
      ];
    }
    return [
      { label: "Active Users", value: users.filter((item) => item.is_active).length },
      { label: "System Health", value: "99%" },
      { label: "Last Backup", value: "1h ago" },
      { label: "Disk Usage", value: "42%" },
    ];
  }, [role, attendancePercentage, studentCgpa, enrollments.length, todayClasses.length, teacherStudents.length, visibleCourses.length, pendingOwnResults.length, users, courses.length, results]);

  const submitAttendance = async (event) => {
    event.preventDefault();
    setNotice("");
    try {
      await api.post("/attendance/records/", attendanceForm);
      setAttendanceForm({ course: "", student: "", date: "", status: "present" });
      addLog("Attendance recorded.");
      setNotice("Attendance saved.");
      await loadData();
    } catch {
      setNotice("Could not save attendance.");
    }
  };

  const submitResult = async (event) => {
    event.preventDefault();
    setNotice("");
    try {
      const { grade, gpa } = scoreToGrade(resultForm.mark);
      await api.post("/results/items/", {
        student: resultForm.student,
        course: resultForm.course,
        mark: resultForm.mark,
        grade,
        gpa,
        term: resultForm.term,
        published: false,
      });
      setResultForm({ course: "", student: "", mark: "", term: "" });
      addLog("Result entered.");
      setNotice("Result submitted for validation.");
      await loadData();
    } catch {
      setNotice("Could not submit result.");
    }
  };

  const submitRegister = async (targetRole) => {
    setNotice("");
    try {
      await api.post("/users/create/", { ...registerForm, role: targetRole });
      setRegisterForm({ username: "", password: "", first_name: "", last_name: "", email: "", role: targetRole });
      addLog(`${targetRole} account created.`);
      setNotice(`${targetRole} registered successfully.`);
      await loadData();
    } catch (error) {
      setNotice(error?.response?.data?.detail || "Registration failed.");
    }
  };

  const submitTimetable = async (event) => {
    event.preventDefault();
    setNotice("");
    const conflict = timetable.some(
      (item) =>
        item.day === timetableForm.day &&
        item.room.toLowerCase() === timetableForm.room.toLowerCase() &&
        !(timetableForm.end_time <= item.start_time || timetableForm.start_time >= item.end_time)
    );
    if (conflict) {
      setNotice(`Conflict detected in room ${timetableForm.room} on ${timetableForm.day}.`);
      return;
    }
    try {
      await api.post("/timetable/entries/", timetableForm);
      setTimetableForm({ term: "", day: "monday", start_time: "09:00", end_time: "10:00", room: "", course: "", published: true });
      addLog("Timetable entry created.");
      setNotice("Timetable entry created.");
      await loadData();
    } catch {
      setNotice("Could not create timetable entry.");
    }
  };

  const publishResult = async (resultId) => {
    setNotice("");
    try {
      await api.patch(`/results/items/${resultId}/`, { published: true });
      addLog("Result published.");
      setNotice("Result published.");
      await loadData();
    } catch {
      setNotice("Could not publish result.");
    }
  };

  const updateManagedUser = async (target, patchData) => {
    setNotice("");
    try {
      await api.patch(`/users/manage/${target.id}/`, patchData);
      addLog(`Updated user ${target.username}.`);
      setNotice("User updated.");
      await loadData();
    } catch (error) {
      setNotice(error?.response?.data?.detail || "User update failed.");
    }
  };

  const saveSettings = () => {
    localStorage.setItem("admin_settings", JSON.stringify(settings));
    addLog("System settings updated.");
    setNotice("Settings saved.");
  };

  const downloadStudentResults = () => {
    downloadCsv(
      `result-slip-${user?.username || "student"}.csv`,
      results.map((item) => ({
        term: item.term,
        course: item.course_code,
        grade: item.grade,
        mark: item.mark,
        gpa: item.gpa,
      })),
      ["term", "course", "grade", "mark", "gpa"]
    );
  };

  const downloadTeacherAttendance = () => {
    downloadCsv(
      `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`,
      attendance.map((item) => ({
        date: item.date,
        course: item.course_code,
        student: item.student_name,
        status: item.status,
      })),
      ["date", "course", "student", "status"]
    );
  };

  const roleMenus = ROLE_MENUS[role] || ROLE_MENUS.student;

  const dashboardCenterPanel = () => {
    if (role === "student") {
      return (
        <div className="role-panel">
          <h3>Today's Classes</h3>
          <div className="task-list">
            {todayClasses.map((item) => (
              <div key={item.id} className="task-row">
                <div>
                  <strong>{item.start_time}</strong> {item.course_code}
                  <p>{item.room}</p>
                </div>
                <button type="button" className="tiny-btn">Join</button>
              </div>
            ))}
            {!todayClasses.length ? <p>No classes scheduled for today.</p> : null}
          </div>
        </div>
      );
    }
    if (role === "teacher") {
      return (
        <div className="role-panel">
          <h3>Today's Classes</h3>
          <div className="task-list">
            {todayClasses.map((item) => (
              <div key={item.id} className="task-row">
                <div>
                  <strong>{item.start_time}</strong> {item.course_code}
                  <p>{item.room}</p>
                </div>
                <button type="button" className="tiny-btn" onClick={() => setActiveSection("mark-attendance")}>Mark Attendance</button>
              </div>
            ))}
            {!todayClasses.length ? <p>No classes scheduled for today.</p> : null}
          </div>
        </div>
      );
    }
    if (role === "registrar") {
      return (
        <div className="role-panel">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button type="button" onClick={() => setActiveSection("register-student")}>Register New Student</button>
            <button type="button" onClick={() => setActiveSection("register-teacher")}>Register New Teacher</button>
            <button type="button" onClick={() => setActiveSection("timetable")}>Manage Timetable</button>
            <button type="button" onClick={() => setActiveSection("exam-schedule")}>Exam Scheduling</button>
          </div>
        </div>
      );
    }
    return (
      <div className="role-panel">
        <h3>System Management</h3>
        <div className="quick-actions">
          <button type="button" onClick={() => setActiveSection("user-management")}>User Roles and Permissions</button>
          <button type="button" onClick={() => setActiveSection("system-settings")}>System Configuration</button>
          <button type="button" onClick={() => setActiveSection("monitoring")}>System Monitoring</button>
          <button type="button" onClick={() => setActiveSection("monitoring")}>View System Logs</button>
        </div>
      </div>
    );
  };

  const dashboardRightPanel = () => {
    if (role === "student") {
      return (
        <div className="role-panel">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {results.slice(0, 2).map((item) => (
              <div key={item.id} className="activity-item activity-good">Grade posted: {item.course_code} ({item.grade})</div>
            ))}
            {attendancePercentage < 75 ? <div className="activity-item activity-warn">Attendance alert: below 75%</div> : null}
            {!results.length ? <div className="activity-item">No recent grade updates.</div> : null}
          </div>
        </div>
      );
    }

    if (role === "teacher") {
      return (
        <div className="role-panel">
          <h3>Pending Tasks</h3>
          <div className="activity-list">
            <div className="activity-item activity-warn">Grade review: {pendingOwnResults.length} pending publication</div>
            <div className="activity-item">Materials upload pending</div>
            <div className="activity-item activity-good">Exam schedule due this week</div>
          </div>
        </div>
      );
    }

    if (role === "registrar") {
      return (
        <div className="role-panel">
          <h3>Pending Tasks</h3>
          <div className="activity-list">
            <div className="activity-item activity-warn">Student registrations: review new submissions</div>
            <div className="activity-item">Timetable conflicts: {registrarConflicts.length}</div>
            <div className="activity-item">Unpublished results: {results.filter((item) => !item.published).length}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="role-panel">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {actionLogs.slice(0, 6).map((item) => (
            <div key={`${item.time}-${item.message}`} className="activity-item">{item.time} - {item.message}</div>
          ))}
          {!actionLogs.length ? <div className="activity-item">No admin actions logged yet.</div> : null}
        </div>
      </div>
    );
  };

  const renderRoleSection = () => {
    if (activeSection === "dashboard") {
      return (
        <div className="two-column-layout">
          {dashboardCenterPanel()}
          {dashboardRightPanel()}
        </div>
      );
    }

    if (role === "student" && activeSection === "attendance") {
      return (
        <div className="role-panel full">
          <h3>Attendance Records</h3>
          <p>Current attendance: {attendancePercentage}%</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Course</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map((item) => (
                  <tr key={item.id}><td>{item.date}</td><td>{item.course_code}</td><td>{item.status}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "student" && activeSection === "results") {
      return (
        <div className="role-panel full">
          <h3>Result Report</h3>
          <button type="button" className="inline-action" onClick={downloadStudentResults}>Download Result Slip</button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Term</th><th>Course</th><th>Grade</th><th>Mark</th><th>GPA</th></tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id}><td>{item.term}</td><td>{item.course_code}</td><td>{item.grade}</td><td>{item.mark}</td><td>{item.gpa}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "student" && activeSection === "timetable") {
      return (
        <div className="role-panel full">
          <h3>Class Timetable</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Day</th><th>Time</th><th>Course</th><th>Room</th></tr>
              </thead>
              <tbody>
                {visibleTimetable.map((item) => (
                  <tr key={item.id}><td>{item.day}</td><td>{item.start_time} - {item.end_time}</td><td>{item.course_code}</td><td>{item.room}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "teacher" && activeSection === "mark-attendance") {
      return (
        <div className="role-panel full">
          <h3>Mark Attendance</h3>
          <form className="form-grid" onSubmit={submitAttendance}>
            <label>Course
              <select value={attendanceForm.course} onChange={(e) => setAttendanceForm({ ...attendanceForm, course: e.target.value })} required>
                <option value="">Select course</option>
                {visibleCourses.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
              </select>
            </label>
            <label>Student
              <select value={attendanceForm.student} onChange={(e) => setAttendanceForm({ ...attendanceForm, student: e.target.value })} required>
                <option value="">Select student</option>
                {teacherStudents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Date
              <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} required />
            </label>
            <label>Status
              <select value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="excused">Permitted</option>
                <option value="late">Late</option>
              </select>
            </label>
            <button type="submit">Save Attendance</button>
          </form>
        </div>
      );
    }

    if (role === "teacher" && activeSection === "enter-grades") {
      return (
        <div className="role-panel full">
          <h3>Enter Grades</h3>
          <form className="form-grid" onSubmit={submitResult}>
            <label>Course
              <select value={resultForm.course} onChange={(e) => setResultForm({ ...resultForm, course: e.target.value })} required>
                <option value="">Select course</option>
                {visibleCourses.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
              </select>
            </label>
            <label>Student
              <select value={resultForm.student} onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })} required>
                <option value="">Select student</option>
                {teacherStudents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Mark
              <input type="number" min="0" max="100" step="0.01" value={resultForm.mark} onChange={(e) => setResultForm({ ...resultForm, mark: e.target.value })} required />
            </label>
            <label>Term
              <input value={resultForm.term} onChange={(e) => setResultForm({ ...resultForm, term: e.target.value })} required />
            </label>
            <button type="submit">Submit Result</button>
          </form>
        </div>
      );
    }

    if (role === "teacher" && activeSection === "my-courses") {
      return (
        <div className="role-panel full">
          <h3>My Courses</h3>
          <button type="button" className="inline-action" onClick={downloadTeacherAttendance}>Download Attendance Report</button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Course</th><th>Code</th><th>Enrolled Students</th></tr>
              </thead>
              <tbody>
                {visibleCourses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.code}</td>
                    <td>{enrollments.filter((entry) => entry.course === item.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "registrar" && ["register-student", "register-teacher"].includes(activeSection)) {
      const targetRole = activeSection === "register-student" ? "student" : "teacher";
      return (
        <div className="role-panel full">
          <h3>{targetRole === "student" ? "Register Student" : "Register Teacher"}</h3>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              submitRegister(targetRole);
            }}
          >
            <label>Username/ID<input value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} required /></label>
            <label>Password<input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required /></label>
            <label>First name<input value={registerForm.first_name} onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })} /></label>
            <label>Last name<input value={registerForm.last_name} onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })} /></label>
            <label>Email<input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} /></label>
            <button type="submit">Create {targetRole}</button>
          </form>
        </div>
      );
    }

    if (role === "registrar" && activeSection === "timetable") {
      return (
        <div className="role-panel full">
          <h3>Manage Timetable</h3>
          <form className="form-grid" onSubmit={submitTimetable}>
            <label>Term<input value={timetableForm.term} onChange={(e) => setTimetableForm({ ...timetableForm, term: e.target.value })} required /></label>
            <label>Course
              <select value={timetableForm.course} onChange={(e) => setTimetableForm({ ...timetableForm, course: e.target.value })} required>
                <option value="">Select course</option>
                {courses.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
              </select>
            </label>
            <label>Day
              <select value={timetableForm.day} onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value })}>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
              </select>
            </label>
            <label>Start<input type="time" value={timetableForm.start_time} onChange={(e) => setTimetableForm({ ...timetableForm, start_time: e.target.value })} required /></label>
            <label>End<input type="time" value={timetableForm.end_time} onChange={(e) => setTimetableForm({ ...timetableForm, end_time: e.target.value })} required /></label>
            <label>Room<input value={timetableForm.room} onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })} required /></label>
            <button type="submit">Save Timetable</button>
          </form>
          {!!registrarConflicts.length ? <p className="warning">Conflicts: {registrarConflicts.join("; ")}</p> : null}
        </div>
      );
    }

    if (role === "registrar" && activeSection === "exam-schedule") {
      return (
        <div className="role-panel full">
          <h3>Examination and Result Validation</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Course</th><th>Term</th><th>Grade</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((item) => (
                  <tr key={item.id}>
                    <td>{item.student_name}</td>
                    <td>{item.course_code}</td>
                    <td>{item.term}</td>
                    <td>{item.grade}</td>
                    <td>{item.published ? "Published" : "Pending"}</td>
                    <td>
                      {!item.published ? (
                        <button type="button" className="tiny-btn" onClick={() => publishResult(item.id)}>Publish</button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "admin" && activeSection === "user-management") {
      return (
        <div className="role-panel full">
          <h3>User Management</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Username</th><th>Role</th><th>Status</th><th>Role Update</th><th>Access</th></tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.username}</td>
                    <td>{item.role}</td>
                    <td>{item.is_active ? "Active" : "Inactive"}</td>
                    <td>
                      <select
                        value={item.role}
                        onChange={(e) => updateManagedUser(item, { role: e.target.value })}
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                        <option value="registrar">registrar</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="tiny-btn"
                        onClick={() => updateManagedUser(item, { is_active: !item.is_active })}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (role === "admin" && activeSection === "system-settings") {
      return (
        <div className="role-panel full">
          <h3>System Settings</h3>
          <div className="settings-grid">
            <label><input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} /> Enable notifications</label>
            <label><input type="checkbox" checked={settings.strictSecurity} onChange={(e) => setSettings({ ...settings, strictSecurity: e.target.checked })} /> Strict security mode</label>
            <label><input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} /> Maintenance mode</label>
          </div>
          <button type="button" onClick={saveSettings}>Save Settings</button>
        </div>
      );
    }

    if (role === "admin" && activeSection === "monitoring") {
      return (
        <div className="role-panel full">
          <h3>System Monitoring</h3>
          <div className="activity-list">
            <div className="activity-item">API status: healthy</div>
            <div className="activity-item">User sessions: active</div>
            <div className="activity-item">Recorded actions: {actionLogs.length}</div>
            {actionLogs.map((item) => (
              <div key={`${item.time}-${item.message}`} className="activity-item">{item.time} - {item.message}</div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="role-panel full"><p>Section not available.</p></div>;
  };

  if (loading) {
    return <div className="center-screen">Loading dashboard...</div>;
  }

  return (
    <div className="role-shell">
      <aside className="role-sidebar">
        <div className="role-brand">
          <img src={logoImage} alt="CPU College logo" />
          <div>
            <strong>CPU ERP</strong>
          </div>
        </div>

        <nav>
          {roleMenus.map((item) => (
            <button
              type="button"
              key={item.key}
              className={item.key === activeSection ? "menu-btn active" : "menu-btn"}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="logout-btn" onClick={signOut}>Logout</button>
      </aside>

      <div className="role-main">
        <header className="role-header">
          <h1>{roleLabel} Dashboard</h1>
          <div className="welcome-tag">
            <span>Welcome</span>
            <strong>{roleLabel}</strong>
            <i />
          </div>
        </header>

        {notice ? <p className="notice">{notice}</p> : null}

        <section className="summary-grid">
          {summaryCards.map((item) => (
            <article key={item.label} className="summary-card">
              <h4>{item.label}</h4>
              <p>{item.value}</p>
            </article>
          ))}
        </section>

        <section className="section-wrap">{renderRoleSection()}</section>
      </div>
    </div>
  );
}
