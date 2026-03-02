import { useEffect, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user, signOut } = useAuth();
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
            Logged in as <strong>{user?.username}</strong> ({user?.role})
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
    </div>
  );
}

export default DashboardPage;
