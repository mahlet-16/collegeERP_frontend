import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ExamSchedulePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [courses, setCourses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    term: "",
    date: "",
    start_time: "09:00",
    end_time: "11:00",
    room: "",
    course: "",
    description: "",
    published: true,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const [coursesRes, entriesRes] = await Promise.allSettled([
        api.get("/courses/items/"),
        api.get("/timetable/exams/"),
      ]);
      setCourses(coursesRes.status === "fulfilled" ? getList(coursesRes.value.data) : []);
      setEntries(entriesRes.status === "fulfilled" ? getList(entriesRes.value.data) : []);
      if (coursesRes.status === "rejected" && entriesRes.status === "rejected") {
        setError("Could not load exam scheduling resources.");
      }
      setLoading(false);
    };
    load();
  }, []);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "registrar") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading exam scheduler...</p></div>;

  const onFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api.post("/timetable/exams/", form);
      setSuccess("Exam scheduled successfully.");
      setForm({
        term: "",
        date: "",
        start_time: "09:00",
        end_time: "11:00",
        room: "",
        course: "",
        description: "",
        published: true,
      });
      const refreshed = await api.get("/timetable/exams/");
      setEntries(getList(refreshed.data));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to schedule exam.");
    }
  };

  return (
    <div className="role-workspace registrar-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Exam Scheduler</p>
            <h1>Academic Exam Calendar</h1>
            <p className="role-page-subtitle">Create and publish exam assignments for term-based course delivery.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Exam Planning</span>
          <span className="context-meta">Assigned role: {user.role}</span>
          <span className="context-meta">Courses available: {courses.length}</span>
        </section>

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="notice">{success}</p> : null}

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Schedule an Exam</h2>
            <form className="form-grid polished-form" onSubmit={onSubmit}>
              <label>
                Term
                <input name="term" value={form.term} onChange={onFormChange} required />
              </label>
              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={onFormChange} required />
              </label>
              <label>
                Start time
                <input name="start_time" type="time" value={form.start_time} onChange={onFormChange} required />
              </label>
              <label>
                End time
                <input name="end_time" type="time" value={form.end_time} onChange={onFormChange} required />
              </label>
              <label>
                Room
                <input name="room" value={form.room} onChange={onFormChange} required />
              </label>
              <label>
                Course
                <select name="course" value={form.course} onChange={onFormChange} required>
                  <option value="">--select--</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <input name="description" value={form.description} onChange={onFormChange} />
              </label>
              <label>
                Published
                <select name="published" value={String(form.published)} onChange={(event) => setForm((current) => ({ ...current, published: event.target.value === "true" }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <button type="submit">Schedule Exam</button>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Current Exam Calendar</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Room</th>
                    <th>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id}>
                      <td>{item.term}</td>
                      <td>{item.date}</td>
                      <td>{item.start_time}–{item.end_time}</td>
                      <td>{item.course_code}</td>
                      <td>{item.room}</td>
                      <td>{item.published ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                  {!entries.length ? (
                    <tr><td colSpan="6">No exam schedules available.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
