import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function CreateTimetablePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ term: "", day: "monday", start_time: "08:00", end_time: "09:00", room: "", course: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get('/courses/items/').then(r => setCourses(r.data)).catch(() => {});
  }, []);

  if (!user) return <p>Please sign in.</p>;
  if (!["registrar", "admin"].includes(user.role)) return <p>Not authorized.</p>;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post('/timetable/entries/', form);
      alert('Timetable entry created');
    } catch (err) {
      setError(err.response?.data || 'Failed');
    }
  };

  return (
    <div className="page">
      <h1>Create Timetable Entry</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>Term<input name="term" value={form.term} onChange={onChange} required /></label>
        <label>Course
          <select name="course" value={form.course} onChange={onChange} required>
            <option value="">--select--</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
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
        {error ? <p className="error">{JSON.stringify(error)}</p> : null}
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
