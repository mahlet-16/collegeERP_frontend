import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

function downloadCsv(filename, rows) {
  const headers = ["Term", "Course", "Grade", "Mark", "GPA"];
  const content = [headers.join(","), ...rows.map((row) => [row.term, row.course_code, row.grade, row.mark, row.gpa].join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function StudentViewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    avatar_url: "",
    student_id: "",
    level: "",
    program_name: "",
    section_name: "",
    semester_name: "",
    academic_year_name: "",
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      const [attendanceRes, resultsRes, timetableRes, enrollmentRes, programsRes, profileRes] = await Promise.allSettled([
        api.get("/attendance/records/"),
        api.get("/results/items/"),
        api.get("/timetable/entries/"),
        api.get("/courses/enrollments/"),
        api.get("/courses/programs/"),
        api.get("/users/profile/"),
      ]);

      setAttendance(attendanceRes.status === "fulfilled" ? getList(attendanceRes.value.data) : []);
      setResults(resultsRes.status === "fulfilled" ? getList(resultsRes.value.data) : []);
      setTimetable(timetableRes.status === "fulfilled" ? getList(timetableRes.value.data) : []);
      setEnrollments(enrollmentRes.status === "fulfilled" ? getList(enrollmentRes.value.data) : []);
      setPrograms(programsRes.status === "fulfilled" ? getList(programsRes.value.data) : []);
      if (profileRes.status === "fulfilled") {
        const p = profileRes.value.data;
        setProfile({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          email: p.email || "",
          phone: p.phone || "",
          address: p.address || "",
          avatar_url: p.avatar_url || "",
          student_id: p.student_id || "",
          level: p.level || "",
          program_name: p.program_name || "Unassigned",
          section_name: p.section_name || "Unassigned",
          semester_name: p.semester_name || "Unassigned",
          academic_year_name: p.academic_year_name || "Unassigned",
        });
      }

      if ([attendanceRes, resultsRes, timetableRes, enrollmentRes, programsRes, profileRes].every((entry) => entry.status === "rejected")) {
        setError("Could not load student records. Please try again.");
      }

      setLoading(false);
    };

    load();
  }, [user]);

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

  const submitProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      const { data } = await api.patch("/users/profile/", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        avatar_url: profile.avatar_url,
      });
      setSuccess("Profile updated successfully!");
      setProfile((prev) => ({
        ...prev,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        avatar_url: data.avatar_url || "",
      }));
    } catch (err) {
      setError(err.response?.data?.detail || "Could not update profile.");
    }
  };

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "student") return <p>Not authorized.</p>;

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

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="notice">{success}</p> : null}

        <section className="role-metric-grid">
          <article className="role-metric-card"><h3>{attendanceRate}%</h3><p>Attendance Rate</p></article>
          <article className="role-metric-card"><h3>{cgpa}</h3><p>Current CGPA</p></article>
          <article className="role-metric-card"><h3>{enrollments.length}</h3><p>Enrolled Courses</p></article>
          <article className="role-metric-card"><h3>{results.length}</h3><p>Published Results</p></article>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Personal Profile</h2>
            <form className="form-grid polished-form" onSubmit={submitProfile}>
              <label>First name
                <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} required />
              </label>
              <label>Last name
                <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} required />
              </label>
              <label>Email
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
              </label>
              <label>Phone
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </label>
              <label>Address
                <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
              </label>
              <label>Avatar URL
                <input value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://example.com/avatar.jpg" />
              </label>
              <div className="button-row">
                <button type="submit">Update Profile</button>
                <button type="button" className="secondary-btn" onClick={() => downloadCsv("grades-report.csv", results)}>
                  Download Grade Report
                </button>
              </div>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Academic Placement</h2>
            <div className="form-grid polished-form">
              <label>Student ID
                <input value={profile.student_id} disabled />
              </label>
              <label>Academic Year
                <input value={profile.academic_year_name} disabled />
              </label>
              <label>Semester
                <input value={profile.semester_name} disabled />
              </label>
              <label>Program
                <input value={profile.program_name} disabled />
              </label>
              <label>Section
                <input value={profile.section_name} disabled />
              </label>
              <label>Year Level
                <input value={profile.level} disabled />
              </label>
            </div>
          </article>
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
