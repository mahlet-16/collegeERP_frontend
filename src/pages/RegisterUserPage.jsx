import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegisterUserPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  const defaultRole = params.get("role") || "student";

  const [form, setForm] = useState({ username: "", password: "", first_name: "", last_name: "", email: "", role: defaultRole });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/users/create/", form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Please sign in.</p>;
  if (!["registrar", "admin"].includes(user.role)) return <p>Not authorized.</p>;

  return (
    <div className="page">
      <h1>Register {form.role}</h1>
      <form className="card" onSubmit={onSubmit}>
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
          Role
          <select name="role" value={form.role} onChange={onChange}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="registrar">Registrar</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
      </form>
    </div>
  );
}
