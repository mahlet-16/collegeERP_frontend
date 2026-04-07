import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegisterUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  const defaultRole = params.get("role") || "student";

  const [form, setForm] = useState({ username: "", password: "", first_name: "", last_name: "", email: "", phone: "", role: defaultRole });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (user.role === "registrar" && form.role === "admin") {
      setError("Registrar cannot create admin accounts.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/create/", form);
      setSuccess(`${form.role} account created successfully.`);
      setForm({ username: "", password: "", first_name: "", last_name: "", email: "", phone: "", role: defaultRole });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please sign in.</p>;
  if (!["registrar", "admin"].includes(user.role)) return <p>Not authorized.</p>;

  const canAssignAdmin = user.role === "admin";

  return (
    <div className="role-workspace registrar-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Registrar Operations</p>
            <h1>User Registration Center</h1>
            <p className="role-page-subtitle">Create student, teacher, registrar, and permitted administrative accounts.</p>
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
                <input name="username" value={form.username} onChange={onChange} required />
              </label>
              <label>
                Password
                <input name="password" value={form.password} onChange={onChange} required type="password" />
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
                  <option value="registrar">Registrar</option>
                  {canAssignAdmin ? <option value="admin">Admin</option> : null}
                </select>
              </label>
              {error ? <p className="error">{error}</p> : null}
              {success ? <p className="notice">{success}</p> : null}
              <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
            </form>
          </article>

          <article className="role-note-card elevated-card">
            <h3>Role Safety Rules</h3>
            <ul>
              <li>Registrar cannot create or manage admin accounts.</li>
              <li>Use institutional email and phone fields for recoverability.</li>
              <li>New users can sign in immediately after account creation.</li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
