import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminMonitorPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState({
    users: [],
    courses: [],
    attendance: [],
    results: [],
    timetable: [],
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError("");

      const [usersRes, coursesRes, attendanceRes, resultsRes, timetableRes] = await Promise.allSettled([
        api.get("/users/list/"),
        api.get("/courses/items/"),
        api.get("/attendance/records/"),
        api.get("/results/items/"),
        api.get("/timetable/entries/"),
      ]);

      setRecords({
        users: usersRes.status === "fulfilled" ? usersRes.value.data : [],
        courses: coursesRes.status === "fulfilled" ? coursesRes.value.data : [],
        attendance: attendanceRes.status === "fulfilled" ? attendanceRes.value.data : [],
        results: resultsRes.status === "fulfilled" ? resultsRes.value.data : [],
        timetable: timetableRes.status === "fulfilled" ? timetableRes.value.data : [],
      });

      if ([usersRes, coursesRes, attendanceRes, resultsRes, timetableRes].every((entry) => entry.status === "rejected")) {
        setError("Could not load system monitoring feeds.");
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const stats = useMemo(() => {
    const activeUsers = records.users.filter((entry) => entry.is_active).length;
    const pendingResults = records.results.filter((entry) => !entry.published).length;
    const publishedTimetable = records.timetable.filter((entry) => entry.published).length;
    const apiHealth = records.courses.length + records.users.length + records.attendance.length > 0 ? "Healthy" : "Idle";

    return {
      activeUsers,
      pendingResults,
      publishedTimetable,
      apiHealth,
    };
  }, [records]);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "admin") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading monitoring data...</p></div>;

  return (
    <div className="role-workspace admin-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header admin-accent">
          <div>
            <p className="role-page-kicker">System Monitoring</p>
            <h1>Operational Pulse</h1>
            <p className="role-page-subtitle">Observe platform activity, publication workload, and high-level data volume.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Telemetry Wall</span>
          <span className="context-meta">Trackers online: 5</span>
          <span className="context-meta">Health state: {stats.apiHealth}</span>
        </section>

        {error ? <p className="notice">{error}</p> : null}

        <section className="role-metric-grid">
          <article className="role-metric-card"><h3>{stats.activeUsers}</h3><p>Active Users</p></article>
          <article className="role-metric-card"><h3>{records.courses.length}</h3><p>Total Courses</p></article>
          <article className="role-metric-card"><h3>{stats.pendingResults}</h3><p>Pending Results</p></article>
          <article className="role-metric-card"><h3>{stats.apiHealth}</h3><p>API Status</p></article>
        </section>

        <section className="role-two-col">
          <article className="role-note-card elevated-card">
            <h2>Data Channel Volumes</h2>
            <ul>
              <li>Attendance records: {records.attendance.length}</li>
              <li>Result entries: {records.results.length}</li>
              <li>Timetable entries: {records.timetable.length}</li>
              <li>Published timetable entries: {stats.publishedTimetable}</li>
            </ul>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Recent User States</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>User</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.users.slice(0, 15).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.username}</td>
                      <td>{entry.role}</td>
                      <td>{entry.is_active ? "Active" : "Inactive"}</td>
                    </tr>
                  ))}
                  {!records.users.length ? <tr><td colSpan="3">No user telemetry available.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
