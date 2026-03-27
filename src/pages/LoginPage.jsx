import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import logoImage from "../assets/cpu-college-logo.svg";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { signIn, signOut, isAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const me = await signIn(username, password);
      if (me.role !== role) {
        signOut();
        setError(`Role mismatch. This account is registered as ${me.role}.`);
        return;
      }
      navigate(from, { replace: true });
    } catch {
      setError("Login failed. Check credentials and selected role.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="portal-top login-screen">
      <header className="portal-header">
        <div className="portal-brand">
          <img src={logoImage} alt="CPU College logo" className="portal-logo" />
          <div>
            <h2>College ERP System</h2>
            <p>CPU Business and IT College</p>
          </div>
        </div>
      </header>

      <section className="portal-hero login-hero">
        <div className="portal-hero-left">
          <h1>Welcome to College ERP</h1>
          <p>
            Streamline your academic journey with our comprehensive Enterprise Resource
            Planning system. Manage attendance, grades, schedules, and more from one portal.
          </p>
          <ul>
            <li>Track attendance and academic progress</li>
            <li>Manage class schedules and timetables</li>
            <li>View grades and assessment results</li>
            <li>Administrative and registrar tools</li>
          </ul>
          <button type="button" className="get-started">Get Started</button>
        </div>

        <div className="portal-hero-right">
          <div className="role-board login-board">
            <article className="role-tile students">
              <h3>For Students</h3>
              <p>Access your schedule, grades, and attendance records</p>
            </article>
            <article className="role-tile teachers">
              <h3>For Teachers</h3>
              <p>Mark attendance, enter grades, manage courses</p>
            </article>
            <article className="role-tile registrars">
              <h3>For Registrars</h3>
              <p>Manage registrations, timetables, and published results</p>
            </article>

            <form className="login-form" onSubmit={onSubmit}>
              <h3>Sign In</h3>
              <label>
                Login role
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="registrar">Registrar</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                ID / Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {error ? <p className="error">{error}</p> : null}
              <button type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
}

export default LoginPage;
