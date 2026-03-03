import { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TeacherManagePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student: "", course: "", date: "", status: "present" });

  useEffect(() => {
    if (!user) return;
    api.get('/courses/items/').then(r => setCourses(r.data)).catch(() => {});
    api.get('/users/').catch(() => {}); // placeholder if needed
  }, [user]);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== 'teacher') return <p>Not authorized.</p>;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submitAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/records/', form);
      alert('Attendance recorded');
    } catch (err) {
      alert('Failed to record');
    }
  };

  const submitResult = async (e) => {
    e.preventDefault();
    try {
      await api.post('/results/items/', { student: form.student, course: form.course, mark: e.target.mark.value, grade: e.target.grade.value, gpa: e.target.gpa.value, term: e.target.term.value });
      alert('Result entered');
    } catch (err) {
      alert('Failed to enter result');
    }
  };

  return (
    <div className="page">
      <h1>Teacher: Manage</h1>
      <section className="card">
        <h2>Enter Attendance</h2>
        <form onSubmit={submitAttendance}>
          <label>Course
            <select name="course" value={form.course} onChange={onChange} required>
              <option value="">--select--</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
          <label>Student ID<input name="student" value={form.student} onChange={onChange} required /></label>
          <label>Date<input name="date" type="date" value={form.date} onChange={onChange} required /></label>
          <label>Status
            <select name="status" value={form.status} onChange={onChange}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </label>
          <button type="submit">Record</button>
        </form>
      </section>

      <section className="card">
        <h2>Enter Grades</h2>
        <form onSubmit={submitResult}>
          <label>Course
            <select name="course" value={form.course} onChange={onChange} required>
              <option value="">--select--</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
          <label>Student ID<input name="student" value={form.student} onChange={onChange} required /></label>
          <label>Mark<input name="mark" type="number" step="0.01" /></label>
          <label>Grade<input name="grade" /></label>
          <label>GPA<input name="gpa" step="0.01" /></label>
          <label>Term<input name="term" /></label>
          <button type="submit">Submit Result</button>
        </form>
      </section>
    </div>
  );
}
