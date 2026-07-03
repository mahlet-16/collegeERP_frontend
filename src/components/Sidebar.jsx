import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logoImage from "../assets/cpu-college-logo.svg";

const links = [
  { to: "/", label: "Dashboard", icon: "DB" },
  { to: "/student/view", label: "Student Portal", icon: "ST", roles: ["student"] },
  { to: "/teacher/manage", label: "Faculty Workbench", icon: "FC", roles: ["teacher"] },
  { to: "/registrar/register", label: "Admissions", icon: "AD", roles: ["registrar"] },
  { to: "/registrar/timetable", label: "Timetable", icon: "TT", roles: ["registrar"] },
  { to: "/registrar/exams", label: "Exam Scheduling", icon: "EX", roles: ["registrar"] },
  { to: "/registrar/academics", label: "Academic Structure", icon: "AS", roles: ["registrar"] },
  { to: "/admin/config", label: "Configuration", icon: "CF", roles: ["admin"] },
  { to: "/admin/monitor", label: "Monitoring", icon: "MO", roles: ["admin"] },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoImage} alt="CPU College logo" className="sidebar-logo" />
        <div className="brand-copy">
          <strong>College ERP</strong>
          <small>Academic operations</small>
        </div>
      </div>
      <div className="sidebar-user">
        <span className="sidebar-label">USER</span>
        <strong>{user?.username || "unknown"}</strong>
        <span className="sidebar-role">{user?.role?.toUpperCase() || "GUEST"}</span>
      </div>
      <nav>
        <ul className="sidebar-links">
          {links
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
        </button>
        <button type="button" className="sidebar-logout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
