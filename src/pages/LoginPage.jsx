import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getApiBaseUrl, api } from "../api/client";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const { signIn, isAuthenticated } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("erp_api_base_url", apiUrl);
    api.defaults.baseURL = apiUrl;
    setShowSettings(false);
    alert("Connection settings saved! Please try logging in again.");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(username, password);
      navigate(from, { replace: true });
    } catch {
      setError("Login failed. Verify your username and password, or check the connection settings.");
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
          
          <div className="login-settings" style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              className="settings-toggle-btn"
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: "0.8rem",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              {showSettings ? "Hide Connection Settings" : "Configure API Connection"}
            </button>
            {showSettings && (
              <form onSubmit={saveSettings} style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  Backend API Base URL:
                  <input
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://college-erp-backend.onrender.com/api"
                    required
                    style={{
                      padding: "0.4rem",
                      fontSize: "0.8rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface-strong)",
                      color: "var(--text)"
                    }}
                  />
                </label>
                <button
                  type="submit"
                  style={{
                    padding: "0.4rem",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    backgroundColor: "var(--role-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Save API Settings
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="login-footnote">
          <p>ERP portal access is monitored and audited.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
