import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function StudentViewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError("");

      const [attendanceRes, resultsRes, timetableRes, enrollmentRes] = await Promise.allSettled([
        api.get("/attendance/records/"),
        api.get("/results/items/"),
        api.get("/timetable/entries/"),
        api.get("/courses/enrollments/"),
      ]);

      setAttendance(attendanceRes.status === "fulfilled" ? attendanceRes.value.data : []);
      setResults(resultsRes.status === "fulfilled" ? resultsRes.value.data : []);
      setTimetable(timetableRes.status === "fulfilled" ? timetableRes.value.data : []);
      setEnrollments(enrollmentRes.status === "fulfilled" ? enrollmentRes.value.data : []);

      if ([attendanceRes, resultsRes, timetableRes, enrollmentRes].every((entry) => entry.status === "rejected")) {
        setError("Could not load student records. Please try again.");
      }

      setLoading(false);
    };

    load();
  }, [user]);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "student") return <p>Not authorized.</p>;

  const attendanceRate = useMemo(() => {
    if (!attendance.length) return "0.0";
    const attended = attendance.filter((item) => ["present", "late", "excused"].includes(item.status)).length;
    return ((attended / attendance.length) * 100).toFixed(1);
  }, [attendance]);

  const cgpa = useMemo(() => {
    if (!results.length) return "0.00";
    const total = results.reduce((sum, item) => sum + Number(item.gpa || 0), 0);
    return (total / results.length).toFixed(2);
  }, [results]);

  const sortedTimetable = [...timetable].sort((a, b) => {
    const dayOrder = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };
    const byDay = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (byDay !== 0) return byDay;
    return a.start_time.localeCompare(b.start_time);
  });

  if (loading) {
    return <div className="page role-page"><p>Loading your student records...</p></div>;
  }

  return (
    <div className="role-workspace student-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header student-accent">
          <div>
            <p className="role-page-kicker">Student Portal</p>
            <h1>Academic Snapshot</h1>
            <p className="role-page-subtitle">Track attendance, review grades, and verify your weekly class plan.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Live Student Feed</span>
          <span className="context-meta">Records synced for {user.username}</span>
          <span className="context-meta">Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </section>

        {error ? <p className="notice">{error}</p> : null}

        <section className="role-metric-grid">
          <article className="role-metric-card"><h3>{attendanceRate}%</h3><p>Attendance Rate</p></article>
          <article className="role-metric-card"><h3>{cgpa}</h3><p>Current CGPA</p></article>
          <article className="role-metric-card"><h3>{enrollments.length}</h3><p>Enrolled Courses</p></article>
          <article className="role-metric-card"><h3>{results.length}</h3><p>Published Results</p></article>
        </section>

        <section className="role-table-card elevated-card">
          <h2>Attendance History</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Date</th><th>Course</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.course_code}</td>
                    <td><span className="table-status">{entry.status}</span></td>
                  </tr>
                ))}
                {!attendance.length ? <tr><td colSpan="3">No attendance records yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Result Ledger</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>Term</th><th>Course</th><th>Grade</th><th>Mark</th><th>GPA</th></tr>
                </thead>
                <tbody>
                  {results.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.term}</td>
                      <td>{entry.course_code}</td>
                      <td>{entry.grade}</td>
                      <td>{entry.mark}</td>
                      <td>{entry.gpa}</td>
                    </tr>
                  ))}
                  {!results.length ? <tr><td colSpan="5">No results are published yet.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Weekly Timetable</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>Day</th><th>Time</th><th>Course</th><th>Room</th></tr>
                </thead>
                <tbody>
                  {sortedTimetable.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.day}</td>
                      <td>{entry.start_time} - {entry.end_time}</td>
                      <td>{entry.course_code}</td>
                      <td>{entry.room}</td>
                    </tr>
                  ))}
                  {!sortedTimetable.length ? <tr><td colSpan="4">No timetable entries are available.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
