import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegistrarAcademicPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseForm, setCourseForm] = useState({ code: "", name: "", credit_hour: 3, program: "", teacher: "" });
  const [programForm, setProgramForm] = useState({ name: "", department: "" });
  const [departmentForm, setDepartmentForm] = useState({ name: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const [programRes, deptRes, courseRes, userRes] = await Promise.allSettled([
        api.get("/courses/programs/"),
        api.get("/courses/departments/"),
        api.get("/courses/items/"),
        api.get("/users/list/"),
      ]);

      setPrograms(programRes.status === "fulfilled" ? getList(programRes.value.data) : []);
      setDepartments(deptRes.status === "fulfilled" ? getList(deptRes.value.data) : []);
      setCourses(courseRes.status === "fulfilled" ? getList(courseRes.value.data) : []);

      if (userRes.status === "fulfilled") {
        const allUsers = getList(userRes.value.data);
        setStudents(allUsers.filter((entry) => entry.role === "student"));
        setTeachers(allUsers.filter((entry) => entry.role === "teacher"));
      } else {
        setStudents([]);
        setTeachers([]);
      }

      if ([programRes, deptRes, courseRes, userRes].every((entry) => entry.status === "rejected")) {
        setError("Could not load academic management resources.");
      }
      setLoading(false);
    };

    load();
  }, []);

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "registrar") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading academic tools...</p></div>;

  const onCourseChange = (event) => {
    const { name, value } = event.target;
    setCourseForm((current) => ({ ...current, [name]: value }));
  };

  const onProgramChange = (event) => {
    const { name, value } = event.target;
    setProgramForm((current) => ({ ...current, [name]: value }));
  };

  const onDepartmentChange = (event) => {
    const { name, value } = event.target;
    setDepartmentForm((current) => ({ ...current, [name]: value }));
  };

  const onCourseSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/courses/items/", courseForm);
      const refreshed = await api.get("/courses/items/");
      setCourses(getList(refreshed.data));
      setCourseForm({ code: "", name: "", credit_hour: 3, program: "", teacher: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create course.");
    }
  };

  const onProgramSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/courses/programs/", programForm);
      const refreshed = await api.get("/courses/programs/");
      setPrograms(getList(refreshed.data));
      setProgramForm({ name: "", department: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create program.");
    }
  };

  const onDepartmentSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/courses/departments/", departmentForm);
      const refreshed = await api.get("/courses/departments/");
      setDepartments(getList(refreshed.data));
      setDepartmentForm({ name: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create department.");
    }
  };

  return (
    <div className="role-workspace registrar-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Academic Management</p>
            <h1>Courses and Departments</h1>
            <p className="role-page-subtitle">Create courses, assign teachers, and oversee program structure.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Registrar Control</span>
          <span className="context-meta">Programs loaded: {programs.length}</span>
          <span className="context-meta">Teachers available: {teachers.length}</span>
        </section>

        {error ? <p className="error">{error}</p> : null}

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Create Department</h2>
            <form className="form-grid polished-form" onSubmit={onDepartmentSubmit}>
              <label>
                Department name
                <input name="name" value={departmentForm.name} onChange={onDepartmentChange} required />
              </label>
              <button type="submit">Create Department</button>
            </form>
          </article>

          <article className="role-table-card elevated-card">
            <h2>Create Program</h2>
            <form className="form-grid polished-form" onSubmit={onProgramSubmit}>
              <label>
                Program name
                <input name="name" value={programForm.name} onChange={onProgramChange} required />
              </label>
              <label>
                Department
                <select name="department" value={programForm.department} onChange={onProgramChange} required>
                  <option value="">--select--</option>
                  {departments.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit">Create Program</button>
            </form>
          </article>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Create Course</h2>
            <form className="form-grid polished-form" onSubmit={onCourseSubmit}>
              <label>
                Course code
                <input name="code" value={courseForm.code} onChange={onCourseChange} required />
              </label>
              <label>
                Name
                <input name="name" value={courseForm.name} onChange={onCourseChange} required />
              </label>
              <label>
                Credit hour
                <input name="credit_hour" type="number" min="1" max="12" value={courseForm.credit_hour} onChange={onCourseChange} required />
              </label>
              <label>
                Program
                <select name="program" value={courseForm.program} onChange={onCourseChange}>
                  <option value="">--select--</option>
                  {programs.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Teacher
                <select name="teacher" value={courseForm.teacher} onChange={onCourseChange}>
                  <option value="">--select--</option>
                  {teachers.map((option) => (
                    <option key={option.id} value={option.id}>{option.username}</option>
                  ))}
                </select>
              </label>
              <button type="submit">Create Course</button>
            </form>
          </article>
        </section>

        <section className="role-table-card elevated-card">
          <h2>Academic Structure</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Program</th><th>Teacher</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{course.program_name || "-"}</td>
                    <td>{course.teacher_name || "Unassigned"}</td>
                  </tr>
                ))}
                {!courses.length ? <tr><td colSpan="4">No courses configured yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
