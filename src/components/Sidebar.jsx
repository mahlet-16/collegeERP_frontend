import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const common = [
    { to: "/", label: "Dashboard" },
  ];

  const menus = {
    admin: [
      { to: "/admin/config", label: "System Settings" },
      { to: "/admin/monitor", label: "Monitoring" },
    ],
    registrar: [
      { to: "/users/create", label: "Register Student" },
      { to: "/users/create?role=teacher", label: "Register Teacher" },
      { to: "/timetable/create", label: "Timetable" },
    ],
    teacher: [
      { to: "/teacher/manage", label: "Mark Attendance" },
      { to: "/teacher/manage", label: "Enter Grades" },
      { to: "/teacher/manage", label: "My Courses" },
    ],
    student: [
      { to: "/student/view", label: "Attendance" },
      { to: "/student/view", label: "Results" },
      { to: "/student/view", label: "Timetable" },
    ],
  };

  const role = user?.role || "";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">College ERP</div>
      <nav>
        <ul>
          {common.map((m) => (
            <li key={m.to}>
              <NavLink to={m.to} className={({isActive}) => isActive? 'active':''}>{m.label}</NavLink>
            </li>
          ))}

          {(menus[role] || []).map((m) => (
            <li key={m.to}>
              <NavLink to={m.to} className={({isActive}) => isActive? 'active':''}>{m.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
