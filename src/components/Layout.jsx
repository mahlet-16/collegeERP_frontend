import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logoImage from "../assets/cpu-college-logo.svg";
import Icon from "./Icons";

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Guest";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
            <div className="top-chip top-date">
              <strong>{today}</strong>
              <span>Live session</span>
            </div>
            <div className="top-chip">
              <strong>{user?.username || "Unknown"}</strong>
              <span>{roleLabel}</span>
            </div>
            <button type="button" className="theme-toggle-header" onClick={toggleTheme} title="Toggle theme">
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <button type="button" className="logout-btn-header" onClick={signOut} title="Sign out">
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
