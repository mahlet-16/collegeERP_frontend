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
    let mounted = true;
    const loadSummary = async () => {
      try {
        const [courses, attendance, results, timetable] = await Promise.allSettled([
          api.get("/courses/items/"),
          api.get("/attendance/records/"),
          api.get("/results/items/"),
          api.get("/timetable/entries/"),
        ]);

        if (!mounted) return;

        setSummary({
          courses: courses.status === "fulfilled" ? courses.value.data.length : 0,
          attendance: attendance.status === "fulfilled" ? attendance.value.data.length : 0,
          results: results.status === "fulfilled" ? results.value.data.length : 0,
          timetable: timetable.status === "fulfilled" ? timetable.value.data.length : 0,
        });
      } catch (err) {
        // ignore
      }
    };

    loadSummary();
    return () => (mounted = false);
  }, []);

  const roleLabel = user
    ? { student: "Student", teacher: "Teacher", registrar: "Registrar", admin: "Admin" }[user.role] || user.role
    : "Not signed in";

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>{user?.role ? `${roleLabel} Dashboard` : "Dashboard"}</h1>
          <p>
            Welcome, <strong>{user?.first_name || user?.username}</strong> — {roleLabel}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={signOut}>Logout</button>
        </div>
      </header>

      <section className="top-cards">
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

      <section className="layout-two">
        <div className="left-panel">
          <section className="panel card">
            <h2>Quick Actions</h2>
            {user?.role === "registrar" && (
              <div className="action-list">
                <button onClick={() => navigate("/users/create?role=student")}>Register Student</button>
                <button onClick={() => navigate("/users/create?role=teacher")}>Register Teacher</button>
                <button onClick={() => navigate("/timetable/create")}>Create Timetable</button>
              </div>
            )}

            {user?.role === "admin" && (
              <div className="action-list">
                <button onClick={() => navigate("/admin/monitor")}>Monitor System</button>
                <button onClick={() => navigate("/admin/config")}>Configure System</button>
              </div>
            )}

            {user?.role === "teacher" && (
              <div className="action-list">
                <button onClick={() => navigate("/teacher/manage")}>Enter Attendance</button>
                <button onClick={() => navigate("/teacher/manage")}>Enter Grades</button>
              </div>
            )}

            {user?.role === "student" && (
              <div className="action-list">
                <button onClick={() => navigate("/student/view")}>View Attendance</button>
                <button onClick={() => navigate("/student/view")}>View Results</button>
                <button onClick={() => navigate("/student/view")}>View Timetable</button>
              </div>
            )}
          </section>
        </div>

        <div className="right-panel">
          <section className="panel card">
            <h2>Pending Tasks</h2>
            <ul className="pending-list">
              <li>No pending tasks</li>
            </ul>
          </section>
          <section className="panel card">
            <h2>Recent Activity</h2>
            <ul className="recent-list">
              <li>System running</li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
