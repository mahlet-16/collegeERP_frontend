import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, signOut } = useAuth();

  const capability = {
    admin: ["Configure system", "Manage roles", "Monitor platform", "Recovery planning"],
    registrar: ["Register users", "Manage status", "Create courses", "Publish timetable"],
    teacher: ["Record attendance", "Enter results", "View teaching load", "Class reports"],
    student: ["View profile", "Track attendance", "View grades", "Check timetable"],
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">College ERP</div>
      <nav>
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-role">
        <h4>{(user?.role || "").toUpperCase()}</h4>
        <ul>
          {(capability[user?.role] || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <button type="button" className="sidebar-logout" onClick={signOut}>
        Logout
      </button>
    </aside>
  );
}
