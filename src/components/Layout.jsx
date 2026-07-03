import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import logoImage from "../assets/cpu-college-logo.svg";

export default function Layout({ children }) {
  const { user } = useAuth();
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-frame">
        <header className="top-nav">
          <div className="top-nav-brand">
            <img src={logoImage} alt="CPU College logo" className="top-nav-logo" />
            <div>
              <span className="eyebrow">Academic Command Center</span>
              <h1>{roleLabel} Workspace</h1>
            </div>
          </div>
          <div className="top-actions">
            <label className="global-search">
              <span>Search</span>
              <input aria-label="Global search" placeholder="Find students, courses, rooms..." />
            </label>
            <div className="top-chip">
              <strong>{user?.username || "Unknown"}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
