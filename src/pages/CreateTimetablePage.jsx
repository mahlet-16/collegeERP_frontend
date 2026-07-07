import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CreateTimetablePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ term: "", day: "monday", start_time: "08:00", end_time: "09:00", room: "", course: "", published: true });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    const [entriesRes, coursesRes] = await Promise.allSettled([
      api.get("/timetable/entries/"),
      api.get("/courses/items/"),
    ]);
    setEntries(entriesRes.status === "fulfilled" ? getList(entriesRes.value.data) : []);
    setCourses(coursesRes.status === "fulfilled" ? getList(coursesRes.value.data) : []);
    if (entriesRes.status === "rejected" && coursesRes.status === "rejected") {
      setError("Could not load timetable dependencies.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "registrar") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading timetable tools...</p></div>;

  const resetForm = () => {
    setForm({ term: "", day: "monday", start_time: "08:00", end_time: "09:00", room: "", course: "", published: true });
    setEditingId(null);
  };

  const apiMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data?.detail) return data.detail;
    if (data?.non_field_errors?.[0]) return data.non_field_errors[0];
    const firstKey = data && typeof data === "object" ? Object.keys(data)[0] : null;
    if (firstKey) return `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`;
    return fallback;
  };

  const parseTime = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":");
    return Number(h) * 60 + Number(m);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const formStart = parseTime(form.start_time);
    const formEnd = parseTime(form.end_time);

    const hasConflict = entries.some((entry) => {
      if (entry.id === editingId) return false;
      if (entry.day !== form.day) return false;

      const entryStart = parseTime(entry.start_time);
      const entryEnd = parseTime(entry.end_time);

      return (
        entry.room.toLowerCase() === form.room.toLowerCase() &&
        !(formEnd <= entryStart || formStart >= entryEnd)
      );
    });

    if (hasConflict) {
      setError(`Local validation: Conflict detected in room ${form.room} on ${form.day}.`);
      return;
    }

    try {
      if (editingId) {
        await api.patch(`/timetable/entries/${editingId}/`, form);
        setSuccess("Timetable entry updated successfully.");
      } else {
        await api.post("/timetable/entries/", form);
        setSuccess("Timetable entry created successfully.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(apiMessage(err, "Failed to save timetable entry."));
    }
  };

  const editEntry = (entry) => {
    setEditingId(entry.id);
    setForm({
      term: entry.term,
      day: entry.day,
      start_time: entry.start_time?.slice(0, 5) || "08:00",
      end_time: entry.end_time?.slice(0, 5) || "09:00",
      room: entry.room,
      course: entry.course,
      published: entry.published,
    });
    setSuccess("");
    setError("");
  };

  const publishEntry = async (entry) => {
    setError("");
    setSuccess("");
    try {
      await api.post(`/timetable/entries/${entry.id}/publish/`);
      setSuccess(`${entry.course_code} timetable entry published.`);
      await load();
    } catch (err) {
      setError(apiMessage(err, "Failed to publish timetable entry."));
    }
  };

  const deleteEntry = async (entry) => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/timetable/entries/${entry.id}/`);
      setSuccess(`${entry.course_code} timetable entry deleted.`);
      if (editingId === entry.id) resetForm();
      await load();
    } catch (err) {
      setError(apiMessage(err, "Failed to delete timetable entry."));
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
            <h2>{editingId ? "Edit Timetable Entry" : "Create Timetable Entry"}</h2>
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
              <div className="button-row">
                <button type="submit">{editingId ? "Update Entry" : "Create Entry"}</button>
                {editingId ? <button type="button" className="secondary-btn" onClick={resetForm}>Cancel Edit</button> : null}
              </div>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Current Timetable Entries</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>Term</th><th>Day</th><th>Time</th><th>Course</th><th>Room</th><th>State</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.term}</td>
                      <td>{entry.day}</td>
                      <td>{entry.start_time} - {entry.end_time}</td>
                      <td>{entry.course_code}</td>
                      <td>{entry.room}</td>
                      <td>{entry.published ? "Published" : "Draft"}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="tiny-btn" onClick={() => editEntry(entry)}>Edit</button>
                          {!entry.published ? <button type="button" className="tiny-btn" onClick={() => publishEntry(entry)}>Publish</button> : null}
                          <button type="button" className="tiny-btn danger-btn" onClick={() => deleteEntry(entry)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!entries.length ? <tr><td colSpan="7">No timetable entries found.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
