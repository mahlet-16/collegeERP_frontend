import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CreateTimetablePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ term: "", day: "monday", start_time: "08:00", end_time: "09:00", room: "", course: "", published: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [coursesRes, entriesRes] = await Promise.allSettled([
        api.get("/courses/items/"),
        api.get("/timetable/entries/"),
      ]);
      setCourses(coursesRes.status === "fulfilled" ? coursesRes.value.data : []);
      setEntries(entriesRes.status === "fulfilled" ? entriesRes.value.data : []);
      if (coursesRes.status === "rejected" && entriesRes.status === "rejected") {
        setError("Could not load timetable resources.");
      }
      setLoading(false);
    };
    load();
  }, []);

  if (!user) return <p>Please sign in.</p>;
  if (!["registrar", "admin"].includes(user.role)) return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading timetable tools...</p></div>;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const hasConflict = entries.some(
      (entry) =>
        entry.day === form.day &&
        entry.room.toLowerCase() === form.room.toLowerCase() &&
        !(form.end_time <= entry.start_time || form.start_time >= entry.end_time)
    );
    if (hasConflict) {
      setError(`Conflict detected in room ${form.room} on ${form.day}.`);
      return;
    }

    try {
      await api.post('/timetable/entries/', form);
      setSuccess('Timetable entry created successfully.');
      setForm({ term: "", day: "monday", start_time: "08:00", end_time: "09:00", room: "", course: "", published: true });
      const refreshed = await api.get("/timetable/entries/");
      setEntries(refreshed.data);
    } catch (err) {
      setError(typeof err.response?.data === "string" ? err.response.data : "Failed to create timetable entry.");
    }
  };

  return (
    <div className="role-workspace registrar-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Scheduling Desk</p>
            <h1>Timetable Builder</h1>
            <p className="role-page-subtitle">Create conflict-aware class schedules and control publication visibility.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Scheduler Engine</span>
          <span className="context-meta">Courses loaded: {courses.length}</span>
          <span className="context-meta">Entries loaded: {entries.length}</span>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Create Timetable Entry</h2>
            <form className="form-grid polished-form" onSubmit={onSubmit}>
              <label>Term<input name="term" value={form.term} onChange={onChange} required /></label>
              <label>Course
                <select name="course" value={form.course} onChange={onChange} required>
                  <option value="">--select--</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </label>
              <label>Day
                <select name="day" value={form.day} onChange={onChange}>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </label>
              <label>Start<input name="start_time" value={form.start_time} onChange={onChange} type="time" required /></label>
              <label>End<input name="end_time" value={form.end_time} onChange={onChange} type="time" required /></label>
              <label>Room<input name="room" value={form.room} onChange={onChange} required /></label>
              <label>
                Published
                <select name="published" value={String(form.published)} onChange={(e) => setForm({ ...form, published: e.target.value === "true" })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              {error ? <p className="error">{error}</p> : null}
              {success ? <p className="notice">{success}</p> : null}
              <button type="submit">Create Entry</button>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Current Timetable Entries</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>Term</th><th>Day</th><th>Time</th><th>Course</th><th>Room</th><th>Published</th></tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.term}</td>
                      <td>{entry.day}</td>
                      <td>{entry.start_time} - {entry.end_time}</td>
                      <td>{entry.course_code}</td>
                      <td>{entry.room}</td>
                      <td>{entry.published ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                  {!entries.length ? <tr><td colSpan="6">No timetable entries found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
