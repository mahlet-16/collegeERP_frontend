import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImage from "../assets/cpu-college-logo.svg";
import Icon from "./Icons";

const links = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/student/view", label: "Student Portal", icon: "students", roles: ["student"] },
  { to: "/teacher/manage", label: "Faculty Workbench", icon: "teachers", roles: ["teacher"] },
  { to: "/registrar/register", label: "Admissions", icon: "registrar", roles: ["registrar"] },
  { to: "/registrar/timetable", label: "Timetable", icon: "timetable", roles: ["registrar"] },
  { to: "/registrar/exams", label: "Exam Scheduling", icon: "exams", roles: ["registrar"] },
  { to: "/registrar/academics", label: "Academic Structure", icon: "structure", roles: ["registrar"] },
  { to: "/admin/config", label: "Configuration", icon: "settings", roles: ["admin"] },
  { to: "/admin/monitor", label: "Monitoring", icon: "monitoring", roles: ["admin"] },
];

export default function Sidebar() {
  const { user } = useAuth();

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
                  <span className="nav-icon" title={item.label}>
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
}
