import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { signIn, isAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch {
      setError("Login failed. Verify your username and password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen erp-login">
      <div className="login-panel">
        <div className="login-header">
          <h1>COLLEGE ERP</h1>
          <p>Secure academic operations portal</p>
        </div>

        <div className="login-body">
          <p className="login-instructions">
            Sign in with your institution account to manage academic records, schedules, results, and operational workflows.
          </p>
          <form className="login-form" onSubmit={onSubmit}>
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                autoFocus
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
            {error ? <div className="error-box">{error}</div> : null}
            <button type="submit" disabled={submitting}>
              {submitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="login-footnote">
          <p>ERP portal access is monitored and audited.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;