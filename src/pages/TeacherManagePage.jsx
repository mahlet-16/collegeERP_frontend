import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

function scoreToGrade(mark) {
  const numeric = Number(mark);
  if (numeric >= 85) return { grade: "A", gpa: 4.0 };
  if (numeric >= 75) return { grade: "B", gpa: 3.5 };
  if (numeric >= 65) return { grade: "C", gpa: 3.0 };
  if (numeric >= 50) return { grade: "D", gpa: 2.0 };
  return { grade: "F", gpa: 0.0 };
}

export default function TeacherManagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [form, setForm] = useState({ student: "", course: "", date: "", status: "present" });
  const [resultForm, setResultForm] = useState({ student: "", course: "", mark: "", term: "" });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setNotice("");

    const [coursesRes, enrollmentsRes, attendanceRes, resultsRes] = await Promise.allSettled([
      api.get("/courses/items/"),
      api.get("/courses/enrollments/"),
      api.get("/attendance/records/"),
      api.get("/results/items/"),
    ]);

    const allCourses = coursesRes.status === "fulfilled" ? coursesRes.value.data : [];
    const mine = allCourses.filter((entry) => entry.teacher === user.id);
    const mineIds = new Set(mine.map((entry) => entry.id));

    setCourses(mine);
    setEnrollments(
      enrollmentsRes.status === "fulfilled"
        ? enrollmentsRes.value.data.filter((entry) => mineIds.has(entry.course))
        : []
    );
    setAttendanceRecords(
      attendanceRes.status === "fulfilled"
        ? attendanceRes.value.data.filter((entry) => mineIds.has(entry.course))
        : []
    );
    setPendingResults(
      resultsRes.status === "fulfilled"
        ? resultsRes.value.data.filter((entry) => mineIds.has(entry.course) && !entry.published)
        : []
    );

    if ([coursesRes, enrollmentsRes, attendanceRes, resultsRes].every((entry) => entry.status === "rejected")) {
      setNotice("Could not load teacher workspace data.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "teacher") return <p>Not authorized.</p>;

  const students = Array.from(
    enrollments.reduce((acc, entry) => {
      if (!acc.has(entry.student)) {
        acc.set(entry.student, { id: entry.student, name: entry.student_name });
      }
      return acc;
    }, new Map()).values()
  );

  if (loading) {
    return <div className="page role-page"><p>Loading teacher workspace...</p></div>;
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submitAttendance = async (e) => {
    e.preventDefault();
    setNotice("");
    try {
      await api.post("/attendance/records/", form);
      setForm({ student: "", course: "", date: "", status: "present" });
      setNotice("Attendance recorded successfully.");
      await loadData();
    } catch {
      setNotice("Failed to record attendance.");
    }
  };

  const submitResult = async (e) => {
    e.preventDefault();
    setNotice("");
    try {
      const { grade, gpa } = scoreToGrade(resultForm.mark);
      await api.post("/results/items/", {
        student: resultForm.student,
        course: resultForm.course,
        mark: resultForm.mark,
        grade,
        gpa,
        term: resultForm.term,
        published: false,
      });
      setResultForm({ student: "", course: "", mark: "", term: "" });
      setNotice("Result submitted for registrar/admin publication.");
      await loadData();
    } catch {
      setNotice("Failed to enter result.");
    }
  };

  return (
    <div className="role-workspace teacher-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header teacher-accent">
          <div>
            <p className="role-page-kicker">Teacher Workspace</p>
            <h1>Instructional Operations</h1>
            <p className="role-page-subtitle">Capture attendance, enter marks, and monitor pending publication tasks.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Teaching Console</span>
          <span className="context-meta">Signed in as {user.username}</span>
          <span className="context-meta">{new Date().toLocaleDateString()}</span>
        </section>

        {notice ? <p className="notice">{notice}</p> : null}

        <section className="role-metric-grid">
          <article className="role-metric-card"><h3>{courses.length}</h3><p>Assigned Courses</p></article>
          <article className="role-metric-card"><h3>{students.length}</h3><p>Tracked Students</p></article>
          <article className="role-metric-card"><h3>{attendanceRecords.length}</h3><p>Attendance Logs</p></article>
          <article className="role-metric-card"><h3>{pendingResults.length}</h3><p>Unpublished Results</p></article>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Enter Attendance</h2>
            <form className="form-grid polished-form" onSubmit={submitAttendance}>
              <label>Course
                <select name="course" value={form.course} onChange={onChange} required>
                  <option value="">--select--</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </label>
              <label>Student
                <select name="student" value={form.student} onChange={onChange} required>
                  <option value="">--select--</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label>Date<input name="date" type="date" value={form.date} onChange={onChange} required /></label>
              <label>Status
                <select name="status" value={form.status} onChange={onChange}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </label>
              <button type="submit">Record Attendance</button>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Enter Grades</h2>
            <form className="form-grid polished-form" onSubmit={submitResult}>
              <label>Course
                <select
                  name="course"
                  value={resultForm.course}
                  onChange={(e) => setResultForm({ ...resultForm, course: e.target.value })}
                  required
                >
                  <option value="">--select--</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </label>
              <label>Student
                <select
                  name="student"
                  value={resultForm.student}
                  onChange={(e) => setResultForm({ ...resultForm, student: e.target.value })}
                  required
                >
                  <option value="">--select--</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label>Mark
                <input
                  name="mark"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={resultForm.mark}
                  onChange={(e) => setResultForm({ ...resultForm, mark: e.target.value })}
                  required
                />
              </label>
              <label>Term
                <input
                  name="term"
                  value={resultForm.term}
                  onChange={(e) => setResultForm({ ...resultForm, term: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Submit Result</button>
            </form>
          </article>
        </section>

        <section className="role-table-card elevated-card">
          <h2>Pending Publication Queue</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Student</th><th>Course</th><th>Term</th><th>Grade</th><th>Mark</th></tr>
              </thead>
              <tbody>
                {pendingResults.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.student_name}</td>
                    <td>{entry.course_code}</td>
                    <td>{entry.term}</td>
                    <td>{entry.grade}</td>
                    <td>{entry.mark}</td>
                  </tr>
                ))}
                {!pendingResults.length ? <tr><td colSpan="5">No pending results at the moment.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
