import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, getCount, getList } from "../api/client";
import logoImage from "../assets/cpu-college-logo.svg";
import { useAuth } from "../context/AuthContext";

const dayOrder = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const roleCopy = {
  student: {
    title: "Student Success Dashboard",
    subtitle: "Attendance, grades, timetable, and academic profile in one view.",
    accent: "student",
  },
  teacher: {
    title: "Faculty Operations Dashboard",
    subtitle: "Assigned courses, attendance capture, grading workload, and class movement.",
    accent: "teacher",
  },
  registrar: {
    title: "Registrar Command Dashboard",
    subtitle: "Admissions, academic structure, enrollments, schedules, and publication queues.",
    accent: "registrar",
  },
  admin: {
    title: "Administrator Control Dashboard",
    subtitle: "Users, system activity, governance settings, and operational monitoring.",
    accent: "admin",
  },
};

function todayKey() {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
}

function compactName(user) {
  if (!user) return "Unknown user";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
}

function matchesQuery(row, query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return true;
  const haystack = JSON.stringify(row)
    .replace(/[\[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return haystack.includes(normalized);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function EmptyState({ title, detail }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="dashboard-page">
      <div className="skeleton hero-skeleton" />
      <div className="metric-grid">
        <div className="skeleton metric-skeleton" />
        <div className="skeleton metric-skeleton" />
        <div className="skeleton metric-skeleton" />
        <div className="skeleton metric-skeleton" />
      </div>
      <div className="skeleton table-skeleton" />
    </div>
  );
}

function MetricCard({ item }) {
  return (
    <article className="metric-card">
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <small>{item.detail}</small>
    </article>
  );
}

function MiniBars({ title, items }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return (
    <article className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i style={{ width: `${Math.max((Number(item.value) / max) * 100, 4)}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function PaginatedTable({ title, rows, columns, emptyTitle = "No records", emptyDetail = "Records will appear here when available." }) {
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const pageCount = Math.max(Math.ceil(rows.length / pageSize), 1);
  const currentRows = rows.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [rows.length]);

  return (
    <article className="panel table-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span>{rows.length} records</span>
      </div>
      {rows.length ? (
        <>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row) => (
                  <tr key={row.id || JSON.stringify(row)}>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 ? (
            <div className="pagination">
              <button type="button" onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={page === 0}>
                Previous
              </button>
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <button type="button" onClick={() => setPage((value) => Math.min(value + 1, pageCount - 1))} disabled={page + 1 >= pageCount}>
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState title={emptyTitle} detail={emptyDetail} />
      )}
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || "student";
  const copy = roleCopy[role] || roleCopy.student;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [counts, setCounts] = useState({});
  const [records, setRecords] = useState({
    courses: [],
    departments: [],
    programs: [],
    attendance: [],
    results: [],
    timetable: [],
    enrollments: [],
    users: [],
    notifications: [],
    auditLogs: [],
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setNotice("");

      const requests = {
        courses: api.get("/courses/items/"),
        departments: api.get("/courses/departments/"),
        programs: api.get("/courses/programs/"),
        attendance: api.get("/attendance/records/"),
        results: api.get("/results/items/"),
        timetable: api.get("/timetable/entries/"),
        enrollments: api.get("/courses/enrollments/"),
        notifications: api.get("/users/notifications/"),
      };

      if (["registrar", "admin"].includes(role)) {
        requests.users = api.get("/users/list/");
      }
      if (role === "admin") {
        requests.auditLogs = api.get("/users/audit-logs/");
      }

      const entries = await Promise.allSettled(Object.entries(requests).map(async ([key, request]) => [key, await request]));
      const nextRecords = { ...records };
      const nextCounts = {};
      let rejected = 0;

      entries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          const [key, response] = entry.value;
          nextRecords[key] = getList(response.data);
          nextCounts[key] = getCount(response.data);
        } else {
          rejected += 1;
        }
      });

      setRecords(nextRecords);
      setCounts(nextCounts);
      if (rejected === entries.length) {
        setNotice("Could not load dashboard data from the backend.");
      } else if (rejected > 0) {
        setNotice("Some dashboard feeds could not be loaded for this role.");
      }
      setLoading(false);
    };

    load().catch(() => {
      setNotice("Dashboard data request failed.");
      setLoading(false);
    });
  }, [role, user?.id]);

  const courseIdsForUser = useMemo(() => {
    if (role === "student") {
      return new Set(records.enrollments.map((item) => item.course));
    }
    if (role === "teacher") {
      return new Set(records.courses.filter((item) => item.teacher === user?.id).map((item) => item.id));
    }
    return new Set(records.courses.map((item) => item.id));
  }, [records.courses, records.enrollments, role, user?.id]);

  const visibleCourses = useMemo(() => records.courses.filter((item) => courseIdsForUser.has(item.id)), [courseIdsForUser, records.courses]);
  const visibleAttendance = useMemo(() => records.attendance.filter((item) => role !== "teacher" || courseIdsForUser.has(item.course)), [courseIdsForUser, records.attendance, role]);
  const visibleResults = useMemo(() => records.results.filter((item) => role !== "teacher" || courseIdsForUser.has(item.course)), [courseIdsForUser, records.results, role]);
  const visibleTimetable = useMemo(() => {
    const rows = records.timetable.filter((item) => role === "admin" || role === "registrar" || courseIdsForUser.has(item.course));
    return rows.sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99) || String(a.start_time).localeCompare(String(b.start_time)));
  }, [courseIdsForUser, records.timetable, role]);

  const todayClasses = useMemo(() => visibleTimetable.filter((item) => item.day === todayKey()), [visibleTimetable]);
  const attendanceRate = useMemo(() => {
    if (!visibleAttendance.length) return 0;
    const attended = visibleAttendance.filter((item) => ["present", "late", "excused"].includes(item.status)).length;
    return (attended / visibleAttendance.length) * 100;
  }, [visibleAttendance]);

  const cgpa = useMemo(() => {
    if (!visibleResults.length) return "0.00";
    const total = visibleResults.reduce((sum, item) => sum + Number(item.gpa || 0), 0);
    return (total / visibleResults.length).toFixed(2);
  }, [visibleResults]);

  const pendingResults = visibleResults.filter((item) => !item.published);
  const usersByRole = {
    students: records.users.filter((item) => item.role === "student").length,
    teachers: records.users.filter((item) => item.role === "teacher").length,
    registrars: records.users.filter((item) => item.role === "registrar").length,
    admins: records.users.filter((item) => item.role === "admin").length,
  };

  const metrics = useMemo(() => {
    if (role === "student") {
      return [
        { label: "Attendance", value: formatPercent(attendanceRate), detail: `${visibleAttendance.length} records reviewed` },
        { label: "CGPA", value: cgpa, detail: `${visibleResults.length} published results` },
        { label: "Courses", value: records.enrollments.length, detail: "Active enrollments" },
        { label: "Today", value: todayClasses.length, detail: "Classes scheduled" },
      ];
    }
    if (role === "teacher") {
      return [
        { label: "Courses", value: visibleCourses.length, detail: "Assigned courses" },
        { label: "Students", value: new Set(records.enrollments.map((item) => item.student)).size, detail: "Across assigned courses" },
        { label: "Attendance", value: visibleAttendance.length, detail: "Records captured" },
        { label: "Pending", value: pendingResults.length, detail: "Results awaiting publication" },
      ];
    }
    if (role === "registrar") {
      return [
        { label: "Students", value: usersByRole.students, detail: "Registered learners" },
        { label: "Teachers", value: usersByRole.teachers, detail: "Teaching staff" },
        { label: "Programs", value: counts.programs || records.programs.length, detail: `${records.departments.length} departments` },
        { label: "Pending Results", value: pendingResults.length, detail: "Publication queue" },
      ];
    }
    return [
      { label: "Active Users", value: records.users.filter((item) => item.is_active).length, detail: `${records.users.length} total users` },
      { label: "Courses", value: counts.courses || records.courses.length, detail: "Curriculum records" },
      { label: "Audit Logs", value: records.auditLogs.length, detail: "Recent events loaded" },
      { label: "API Feeds", value: Object.keys(counts).length, detail: "Responded successfully" },
    ];
  }, [attendanceRate, cgpa, counts, pendingResults.length, records, role, todayClasses.length, usersByRole, visibleAttendance.length, visibleCourses.length, visibleResults.length]);

  const timetableRows = visibleTimetable.filter((item) => matchesQuery(item, query));
  const resultRows = visibleResults.filter((item) => matchesQuery(item, query));
  const attendanceRows = visibleAttendance.filter((item) => matchesQuery(item, query));
  const userRows = records.users.filter((item) => matchesQuery(item, query));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className={`dashboard-page ${copy.accent}-dashboard`}>
      <section className="dashboard-hero">
        <div>
          <div className="hero-top">
            <img src={logoImage} alt="College ERP logo" className="dashboard-logo" />
            <div>
              <span className="eyebrow">Live ERP Workspace</span>
              <h1>{copy.title}</h1>
            </div>
          </div>
          <p>{copy.subtitle}</p>
          <div className="hero-actions">
            {role === "student" ? <Link to="/student/view">Open Student Portal</Link> : null}
            {role === "teacher" ? <Link to="/teacher/manage">Open Faculty Workbench</Link> : null}
            {role === "registrar" ? <Link to="/registrar/register">Register Users</Link> : null}
            {role === "admin" ? <Link to="/admin/config">Open Configuration</Link> : null}
            <Link to={role === "admin" ? "/admin/monitor" : role === "registrar" ? "/registrar/timetable" : "/"}>Review Operations</Link>
          </div>
        </div>
        <div className="identity-card">
          <strong>{compactName(user)}</strong>
          <span>{role.toUpperCase()}</span>
        </div>
      </section>

      {notice ? <div className="toast-message">{notice}</div> : null}

      <section className="metric-grid">
        {metrics.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section className="toolbar-row">
        <label className="table-search">
          <span>Filter workspace data</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, course, status, term..." />
        </label>
        <div className="status-strip">
          <span>{records.notifications.filter((item) => !item.read).length} unread notifications</span>
          <span>{todayClasses.length} classes today</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <MiniBars
          title="Operational Mix"
          items={[
            { label: "Courses", value: visibleCourses.length },
            { label: "Attendance", value: visibleAttendance.length },
            { label: "Results", value: visibleResults.length },
            { label: "Timetable", value: visibleTimetable.length },
          ]}
        />

        <article className="panel">
          <div className="panel-heading">
            <h2>Today</h2>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="timeline-list">
            {todayClasses.slice(0, 5).map((item) => (
              <div className="timeline-item" key={item.id}>
                <strong>{item.start_time}</strong>
                <span>{item.course_code}</span>
                <small>{item.room}</small>
              </div>
            ))}
            {!todayClasses.length ? <EmptyState title="No classes today" detail="Published timetable entries for today will appear here." /> : null}
          </div>
        </article>
      </section>

      {role === "admin" || role === "registrar" ? (
        <PaginatedTable
          title="User Directory"
          rows={userRows}
          columns={[
            { key: "username", label: "Username" },
            { key: "role", label: "Role" },
            { key: "email", label: "Email" },
            { key: "is_active", label: "Status", render: (row) => (row.is_active ? "Active" : "Inactive") },
          ]}
          emptyTitle="No users loaded"
          emptyDetail="Users are visible to registrar and administrator roles."
        />
      ) : null}

      {role === "teacher" ? (
        <PaginatedTable
          title="Attendance Register"
          rows={attendanceRows}
          columns={[
            { key: "date", label: "Date" },
            { key: "course_code", label: "Course" },
            { key: "student_name", label: "Student" },
            { key: "status", label: "Status" },
          ]}
        />
      ) : (
        <PaginatedTable
          title={role === "student" ? "Published Result Ledger" : "Result Publication Queue"}
          rows={resultRows}
          columns={[
            { key: "term", label: "Term" },
            { key: "course_code", label: "Course" },
            { key: "student_name", label: "Student" },
            { key: "grade", label: "Grade" },
            { key: "published", label: "Status", render: (row) => (row.published ? "Published" : row.is_draft ? "Draft" : "Pending") },
          ]}
        />
      )}

      <PaginatedTable
        title="Timetable Board"
        rows={timetableRows}
        columns={[
          { key: "day", label: "Day" },
          { key: "start_time", label: "Start" },
          { key: "end_time", label: "End" },
          { key: "course_code", label: "Course" },
          { key: "room", label: "Room" },
          { key: "published", label: "State", render: (row) => (row.published ? "Published" : "Draft") },
        ]}
      />
    </div>
  );
}
