import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    courses: 0,
    attendance: 0,
    results: 0,
    timetable: 0,
  });

  useEffect(() => {
    const loadSummary = async () => {
      const [courses, attendance, results, timetable] = await Promise.allSettled([
        api.get("/courses/items/"),
        api.get("/attendance/records/"),
        api.get("/results/items/"),
        api.get("/timetable/entries/"),
      ]);

      setSummary({
        courses: courses.status === "fulfilled" ? courses.value.data.length : 0,
        attendance:
          attendance.status === "fulfilled" ? attendance.value.data.length : 0,
        results: results.status === "fulfilled" ? results.value.data.length : 0,
        timetable:
          timetable.status === "fulfilled" ? timetable.value.data.length : 0,
      });
    };

    loadSummary();
  }, []);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>College ERP</h1>
          <p>
            Logged in as <strong>{user?.username}</strong> (
            {user
              ? {
                  student: "Student",
                  teacher: "Teacher",
                  registrar: "Registrar",
                  admin: "Admin",
                }[user.role] || user.role
              : "Not signed in"
            })
          </p>
        </div>
        <button onClick={signOut}>Logout</button>
      </header>

      <section className="grid">
        <article className="card">
          <h3>Courses</h3>
          <p>{summary.courses}</p>
        </article>
        <article className="card">
          <h3>Attendance Records</h3>
          <p>{summary.attendance}</p>
        </article>
        <article className="card">
          <h3>Results</h3>
          <p>{summary.results}</p>
        </article>
        <article className="card">
          <h3>Timetable Entries</h3>
          <p>{summary.timetable}</p>
        </article>
      </section>

      <section className="actions">
        <h2>Actions</h2>

        {user?.role === "registrar" && (
          <div className="action-list">
            <button onClick={() => navigate('/users/create?role=student')}>Register Student</button>
            <button onClick={() => navigate('/users/create?role=teacher')}>Register Teacher</button>
            <button onClick={() => navigate('/timetable/create')}>Create Timetable</button>
          </div>
        )}

        {user?.role === "admin" && (
          <div className="action-list">
            <button onClick={() => navigate('/admin/monitor')}>Monitor System</button>
            <button onClick={() => navigate('/admin/config')}>Configure System</button>
          </div>
        )}

        {user?.role === "teacher" && (
          <div className="action-list">
            <button onClick={() => navigate('/timetable/view')}>View Timetable</button>
            <button onClick={() => navigate('/attendance/mark')}>Enter Attendance</button>
            <button onClick={() => navigate('/results/enter')}>Enter Grades</button>
          </div>
        )}

        {user?.role === "student" && (
          <div className="action-list">
            <button onClick={() => navigate('/attendance/view')}>View Attendance</button>
            <button onClick={() => navigate('/timetable/view')}>View Timetable</button>
            <button onClick={() => navigate('/results/view')}>View Results</button>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
