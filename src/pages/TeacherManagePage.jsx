import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function TeacherManagePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [pendingResults, setPendingResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  
  const [form, setForm] = useState({ student: "", course: "", date: "", status: "present", comment: "", is_draft: false });
  const [resultForm, setResultForm] = useState({ student: "", course: "", mark: "", term: "", is_draft: false });
  const [editingResultId, setEditingResultId] = useState(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setNotice("");

    const [coursesRes, enrollmentsRes, attendanceRes, resultsRes, timetableRes] = await Promise.allSettled([
      api.get("/courses/items/"),
      api.get("/courses/enrollments/"),
      api.get("/attendance/records/"),
      api.get("/results/items/"),
      api.get("/timetable/entries/"),
    ]);

    const allCourses = coursesRes.status === "fulfilled" ? getList(coursesRes.value.data) : [];
    const mine = allCourses.filter((entry) => entry.teacher === user.id);
    const mineIds = new Set(mine.map((entry) => entry.id));

    setCourses(mine);
    setEnrollments(
      enrollmentsRes.status === "fulfilled"
        ? getList(enrollmentsRes.value.data).filter((entry) => mineIds.has(entry.course))
        : []
    );
    setAttendanceRecords(
      attendanceRes.status === "fulfilled"
        ? getList(attendanceRes.value.data).filter((entry) => mineIds.has(entry.course))
        : []
    );
    setPendingResults(
      resultsRes.status === "fulfilled"
        ? getList(resultsRes.value.data).filter((entry) => mineIds.has(entry.course) && !entry.published)
        : []
    );
    setTimetable(
      timetableRes.status === "fulfilled"
        ? getList(timetableRes.value.data).filter((entry) => mineIds.has(entry.course))
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

  const studentsForCourse = (courseId) => {
    if (!courseId) return students;
    return Array.from(
      enrollments
        .filter((entry) => String(entry.course) === String(courseId))
        .reduce((acc, entry) => {
          if (!acc.has(entry.student)) {
            acc.set(entry.student, { id: entry.student, name: entry.student_name });
          }
          return acc;
        }, new Map())
        .values()
    );
  };

  const attendanceStudents = studentsForCourse(form.course);
  const resultStudents = studentsForCourse(resultForm.course);

  if (loading) {
    return <div className="page role-page"><p>Loading teacher workspace...</p></div>;
  }

  const onChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === "course") {
      next.student = "";
    }
    setForm(next);
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    setNotice("");
    try {
      await api.post("/attendance/records/", form);
      setForm({ student: "", course: "", date: "", status: "present", comment: "", is_draft: false });
      setNotice("Attendance recorded successfully.");
      await loadData();
    } catch (err) {
      setNotice(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Failed to record attendance.");
    }
  };

  const resetResultForm = () => {
    setResultForm({ student: "", course: "", mark: "", term: "", is_draft: false });
    setEditingResultId(null);
  };

  const editResult = (entry) => {
    setEditingResultId(entry.id);
    setResultForm({
      student: entry.student,
      course: entry.course,
      mark: entry.mark,
      term: entry.term,
      is_draft: entry.is_draft,
    });
    setNotice("");
  };

  const deleteResult = async (entry) => {
    setNotice("");
    try {
      await api.delete(`/results/items/${entry.id}/`);
      setNotice(`Result for ${entry.student_name} deleted.`);
      if (editingResultId === entry.id) {
        resetResultForm();
      }
      await loadData();
    } catch (err) {
      setNotice(err.response?.data?.detail || "Failed to delete result.");
    }
  };

  const submitResult = async (e) => {
    e.preventDefault();
    setNotice("");
    try {
      const payload = {
        student: resultForm.student,
        course: resultForm.course,
        mark: resultForm.mark,
        term: resultForm.term,
        is_draft: resultForm.is_draft,
        published: false,
      };
      if (editingResultId) {
        await api.patch(`/results/items/${editingResultId}/`, payload);
        setNotice("Result updated successfully.");
      } else {
        await api.post("/results/items/", payload);
        setNotice("Result submitted for registrar/admin publication.");
      }
      resetResultForm();
      await loadData();
    } catch (err) {
      setNotice(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "Failed to save result.");
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
                  {attendanceStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              <label>Comment
                <input name="comment" value={form.comment} onChange={onChange} placeholder="Optional attendance note" />
              </label>
              <label>
                Draft
                <select name="is_draft" value={String(form.is_draft)} onChange={(e) => setForm({ ...form, is_draft: e.target.value === "true" })}>
                  <option value="false">Final</option>
                  <option value="true">Draft</option>
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
                  onChange={(e) => setResultForm({ ...resultForm, course: e.target.value, student: "" })}
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
                  {resultStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              <label>
                Draft
                <select value={String(resultForm.is_draft)} onChange={(e) => setResultForm({ ...resultForm, is_draft: e.target.value === "true" })}>
                  <option value="false">Submit for Publication</option>
                  <option value="true">Save Draft</option>
                </select>
              </label>
              <div className="button-row">
                <button type="submit">{editingResultId ? (resultForm.is_draft ? "Update Draft" : "Update Result") : (resultForm.is_draft ? "Save Draft" : "Submit Result")}</button>
                {editingResultId ? <button type="button" className="secondary-btn" onClick={resetResultForm}>Cancel Edit</button> : null}
              </div>
            </form>
          </article>
        </section>

        <section className="role-table-card elevated-card">
          <h2>Pending Publication Queue</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Student</th><th>Course</th><th>Term</th><th>Grade</th><th>Mark</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {pendingResults.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.student_name}</td>
                    <td>{entry.course_code}</td>
                    <td>{entry.term}</td>
                    <td>{entry.grade}</td>
                    <td>{entry.mark}</td>
                    <td>{entry.is_draft ? "Draft" : "Submitted"}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="tiny-btn" onClick={() => editResult(entry)}>Edit</button>
                        <button type="button" className="tiny-btn danger-btn" onClick={() => deleteResult(entry)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pendingResults.length ? <tr><td colSpan="7">No pending results at the moment.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="role-table-card elevated-card">
          <h2>Assigned Timetable</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Term</th><th>Day</th><th>Time</th><th>Course</th><th>Room</th></tr>
              </thead>
              <tbody>
                {timetable.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.term}</td>
                    <td>{entry.day}</td>
                    <td>{entry.start_time} - {entry.end_time}</td>
                    <td>{entry.course_code}</td>
                    <td>{entry.room}</td>
                  </tr>
                ))}
                {!timetable.length ? <tr><td colSpan="5">No assigned timetable is available.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
