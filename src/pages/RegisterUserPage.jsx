import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "student",
  student_id: "",
  level: "",
  address: "",
  section: "",
  program: "",
  staff_id: "",
  office: "",
  department: "",
};

export default function RegisterUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    const loadAcademicOptions = async () => {
      const [programRes, sectionRes, departmentRes] = await Promise.allSettled([
        api.get("/courses/programs/"),
        api.get("/courses/sections/"),
        api.get("/courses/departments/"),
      ]);
      setPrograms(programRes.status === "fulfilled" ? getList(programRes.value.data) : []);
      setSections(sectionRes.status === "fulfilled" ? getList(sectionRes.value.data) : []);
      setDepartments(departmentRes.status === "fulfilled" ? getList(departmentRes.value.data) : []);
    };

    loadAcademicOptions();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCredentials(null);

    if (user.role === "registrar" && form.role === "admin") {
      setError("Registrar cannot create admin accounts.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/users/create/", {
        ...form,
        username: form.username || "",
        password: form.password || "",
        program: form.role === "student" && form.program ? form.program : null,
        section: form.role === "student" && form.section ? form.section : null,
        department: form.role === "teacher" && form.department ? form.department : null,
        student_id: form.role === "student" ? form.student_id || null : null,
        staff_id: form.role === "teacher" ? form.staff_id || null : null,
      });
      setSuccess(`${form.role} account created successfully.`);
      setCredentials({
        username: data.generated_username || data.username || form.username,
        password: data.temporary_password || (form.password ? "Password set by registrar" : ""),
      });
      setForm(emptyForm);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        if (typeof data === "string") {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          const errorMsg = Object.entries(data)
            .map(([field, msgs]) => {
              const label = field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ");
              const detailStr = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
              return `${label}: ${detailStr}`;
            })
            .join(" | ");
          setError(errorMsg || "Failed to create user");
        }
      } else {
        setError(err.message || "Failed to create user");
      }
    } finally {
      setLoading(false);
    }
  };

  const onBulkSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCredentials(null);
    if (!bulkFile) {
      setError("Choose a CSV file before uploading.");
      return;
    }

    const payload = new FormData();
    payload.append("file", bulkFile);
    setLoading(true);
    try {
      const { data } = await api.post("/users/bulk-create/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(`Bulk upload finished: ${data.created?.length || 0} created, ${data.errors?.length || 0} rows need review.`);
      if (data.created?.[0]?.temporary_password) {
        setCredentials({
          username: data.created[0].username,
          password: data.created[0].temporary_password,
        });
      }
      setBulkFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Bulk registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "registrar") return <p>Not authorized.</p>;

  return (
    <div className="role-workspace registrar-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Registrar Operations</p>
            <h1>User Registration Center</h1>
            <p className="role-page-subtitle">Create student and teacher accounts with usable credentials and academic placement.</p>
          </div>
          <button type="button" className="role-page-link" onClick={() => navigate("/")}>Back to Dashboard</button>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Identity Desk</span>
          <span className="context-meta">Authorized role: {user.role}</span>
          <span className="context-meta">Provisioning mode active</span>
        </section>

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>Register New Account</h2>
            <form className="form-grid polished-form" onSubmit={onSubmit}>
              <label>
                Username
                <input name="username" value={form.username} onChange={onChange} placeholder="Auto-generated if blank" />
              </label>
              <label>
                Password
                <input name="password" value={form.password} onChange={onChange} type="password" placeholder="Auto-generated if blank" />
              </label>
              <label>
                First name
                <input name="first_name" value={form.first_name} onChange={onChange} />
              </label>
              <label>
                Last name
                <input name="last_name" value={form.last_name} onChange={onChange} />
              </label>
              <label>
                Email
                <input name="email" value={form.email} onChange={onChange} type="email" />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={onChange} />
              </label>
              <label>
                Role
                <select name="role" value={form.role} onChange={onChange}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </label>
              {form.role === "student" ? (
                <>
                  <label>
                    Student ID
                    <input name="student_id" value={form.student_id} onChange={onChange} placeholder="Auto-generated if blank" />
                  </label>
                  <label>
                    Program
                    <select name="program" value={form.program} onChange={onChange}>
                      <option value="">Select program</option>
                      {programs.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Section
                    <select name="section" value={form.section} onChange={onChange}>
                      <option value="">Auto-assign default section</option>
                      {sections.map((option) => (
                        <option key={option.id} value={option.id}>{option.label || option.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Level
                    <input name="level" value={form.level} onChange={onChange} placeholder="Year 1, Year 2..." />
                  </label>
                  <label>
                    Address
                    <input name="address" value={form.address} onChange={onChange} />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Staff ID
                    <input name="staff_id" value={form.staff_id} onChange={onChange} placeholder="Auto-generated if blank" />
                  </label>
                  <label>
                    Department
                    <select name="department" value={form.department} onChange={onChange}>
                      <option value="">Select department</option>
                      {departments.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Office
                    <input name="office" value={form.office} onChange={onChange} />
                  </label>
                </>
              )}
              {error ? <p className="error">{error}</p> : null}
              {success ? <p className="notice">{success}</p> : null}
              {credentials ? (
                <div className="credential-card">
                  <span>Usable credentials</span>
                  <strong>{credentials.username}</strong>
                  {credentials.password ? <code>{credentials.password}</code> : null}
                </div>
              ) : null}
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
            </form>
          </article>

          <article className="role-note-card elevated-card">
            <h2>Bulk Registration</h2>
            <form className="form-grid polished-form" onSubmit={onBulkSubmit}>
              <label>
                CSV file
                <input type="file" accept=".csv,text/csv" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} />
              </label>
              <button type="submit" disabled={loading}>Upload CSV</button>
            </form>
            <div className="helper-list">
              <span>Columns: username, password, role, first_name, last_name, email, phone.</span>
              <span>Optional: student_id, section, program, level, address, staff_id, department, office.</span>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
