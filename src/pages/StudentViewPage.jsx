import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function StudentViewPage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/attendance/records/').then(r => setAttendance(r.data)).catch(() => {});
    api.get('/results/items/').then(r => setResults(r.data)).catch(() => {});
    api.get('/timetable/entries/').then(r => setTimetable(r.data)).catch(() => {});
  }, [user]);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== 'student') return <p>Not authorized.</p>;

  return (
    <div className="page">
      <h1>Student Dashboard</h1>
      <section className="card">
        <h2>Attendance</h2>
        <ul>{attendance.map(a => <li key={a.id}>{a.course_code} {a.date} - {a.status}</li>)}</ul>
      </section>
      <section className="card">
        <h2>Results</h2>
        <ul>{results.map(r => <li key={r.id}>{r.course_code} - {r.grade} ({r.mark})</li>)}</ul>
      </section>
      <section className="card">
        <h2>Timetable</h2>
        <ul>{timetable.map(t => <li key={t.id}>{t.course?.code} {t.day} {t.start_time} - {t.end_time}</li>)}</ul>
      </section>
    </div>
  );
}
