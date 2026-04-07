import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("admin_settings");
    if (!saved) {
      return { notifications: true, strictSecurity: true, maintenanceMode: false };
    }
    try {
      return JSON.parse(saved);
    } catch {
      return { notifications: true, strictSecurity: true, maintenanceMode: false };
    }
  });

  const loadUsers = async () => {
    if (!user) return;
    setLoading(true);
    setNotice("");
    try {
      const response = await api.get("/users/list/");
      setUsers(response.data);
    } catch {
      setNotice("Could not load users for management.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  const saveSettings = () => {
    localStorage.setItem("admin_settings", JSON.stringify(settings));
    setNotice("System settings saved locally.");
  };

  const updateManagedUser = async (target, patchData) => {
    setNotice("");
    try {
      await api.patch(`/users/manage/${target.id}/`, patchData);
      setNotice(`Updated ${target.username}.`);
      await loadUsers();
    } catch (error) {
      setNotice(error?.response?.data?.detail || "Failed to update user.");
    }
  };

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "admin") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading admin configuration...</p></div>;

  return (
    <div className="role-workspace admin-theme">
      <div className="role-workspace-glow" />
      <div className="page role-page">
        <header className="role-page-header admin-accent">
          <div>
            <p className="role-page-kicker">Admin Control Center</p>
            <h1>Platform Configuration</h1>
            <p className="role-page-subtitle">Manage user roles and access while controlling system-wide policy toggles.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="role-context-strip">
          <span className="context-pill">Governance Layer</span>
          <span className="context-meta">User records: {users.length}</span>
          <span className="context-meta">Session owner: {user.username}</span>
        </section>

        {notice ? <p className="notice">{notice}</p> : null}

        <section className="role-two-col">
          <article className="role-table-card elevated-card">
            <h2>User Role Management</h2>
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr><th>Username</th><th>Role</th><th>Status</th><th>Set Role</th><th>Access</th></tr>
                </thead>
                <tbody>
                  {users.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.username}</td>
                      <td>{entry.role}</td>
                      <td>{entry.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <select
                          value={entry.role}
                          onChange={(event) => updateManagedUser(entry, { role: event.target.value })}
                        >
                          <option value="student">student</option>
                          <option value="teacher">teacher</option>
                          <option value="registrar">registrar</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="tiny-btn"
                          onClick={() => updateManagedUser(entry, { is_active: !entry.is_active })}
                        >
                          {entry.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="role-note-card elevated-card">
            <h2>System Policies</h2>
            <label><input type="checkbox" checked={settings.notifications} onChange={(event) => setSettings({ ...settings, notifications: event.target.checked })} /> Enable notifications</label>
            <label><input type="checkbox" checked={settings.strictSecurity} onChange={(event) => setSettings({ ...settings, strictSecurity: event.target.checked })} /> Strict security mode</label>
            <label><input type="checkbox" checked={settings.maintenanceMode} onChange={(event) => setSettings({ ...settings, maintenanceMode: event.target.checked })} /> Maintenance mode</label>
            <button type="button" onClick={saveSettings}>Save Policies</button>
          </article>
        </section>
      </div>
    </div>
  );
}
