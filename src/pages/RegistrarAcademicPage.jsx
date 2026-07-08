import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, getList } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icons";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const emptyDepartment = { name: "", college: "" };
const emptyProgram = { name: "", department: "" };
const emptyYear = { name: "2025/2026", is_active: true };
const emptySemester = { name: "Semester 1", academic_year: "", number: 1, is_active: true };
const emptySection = { name: "Section A", program: "", academic_year: "", semester: "", year_level: 1, capacity: 60, is_active: true };
const emptyClassroom = { name: "", building: "", capacity: 60, department: "", is_active: true };
const emptyCourse = { code: "", name: "", credit_hour: 3, program: "", section: "", semester: "", teacher: "" };
const emptyEnrollment = { student: "", course: "", term: "2025/2026 Semester 1" };

function apiMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors?.[0]) return data.non_field_errors[0];
  const firstKey = data && typeof data === "object" ? Object.keys(data)[0] : null;
  if (firstKey) return `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`;
  return fallback;
}

function optionLabel(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
}

export default function RegistrarAcademicPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [enrollSection, setEnrollSection] = useState("");
  const [visibleCourses, setVisibleCourses] = useState([]);
  const [visibleSections, setVisibleSections] = useState([]);
  const [visibleEnrollments, setVisibleEnrollments] = useState([]);

  const [data, setData] = useState({
    colleges: [],
    departments: [],
    programs: [],
    years: [],
    semesters: [],
    sections: [],
    classrooms: [],
    courses: [],
    enrollments: [],
    students: [],
    teachers: [],
  });
  const [forms, setForms] = useState({
    department: emptyDepartment,
    program: emptyProgram,
    year: emptyYear,
    semester: emptySemester,
    section: emptySection,
    classroom: emptyClassroom,
    course: emptyCourse,
    enrollment: emptyEnrollment,
  });

  const setForm = (key, patch) => setForms((current) => ({ ...current, [key]: { ...current[key], ...patch } }));

  const loadFilteredData = async (searchVal, sectionFilter) => {
    try {
      const [coursesRes, sectionsRes, enrollmentsRes] = await Promise.all([
        api.get(`/courses/items/?search=${encodeURIComponent(searchVal)}` + (sectionFilter ? `&section=${sectionFilter}` : "")),
        api.get(`/courses/sections/?search=${encodeURIComponent(searchVal)}`),
        api.get(`/courses/enrollments/?search=${encodeURIComponent(searchVal)}` + (sectionFilter ? `&section=${sectionFilter}` : "")),
      ]);
      setVisibleCourses(getList(coursesRes.data));
      setVisibleSections(getList(sectionsRes.data));
      setVisibleEnrollments(getList(enrollmentsRes.data));
    } catch (err) {
      console.error("Error loading filtered data:", err);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    setError("");

    const requests = {
      colleges: api.get("/courses/colleges/"),
      departments: api.get("/courses/departments/"),
      programs: api.get("/courses/programs/"),
      years: api.get("/courses/academic-years/"),
      semesters: api.get("/courses/semesters/"),
      sections: api.get("/courses/sections/"),
      classrooms: api.get("/courses/classrooms/"),
      courses: api.get("/courses/items/"),
      enrollments: api.get("/courses/enrollments/"),
      users: api.get("/users/list/"),
    };

    const entries = await Promise.allSettled(Object.entries(requests).map(async ([key, request]) => [key, await request]));
    const next = { ...data };
    let failed = 0;

    entries.forEach((entry) => {
      if (entry.status === "fulfilled") {
        const [key, response] = entry.value;
        if (key === "users") {
          const users = getList(response.data);
          next.students = users.filter((item) => item.role === "student");
          next.teachers = users.filter((item) => item.role === "teacher");
        } else {
          next[key] = getList(response.data);
        }
      } else {
        failed += 1;
      }
    });

    setData(next);
    if (failed === entries.length) setError("Could not load academic management resources.");

    await loadFilteredData(query, filterSection);
    setLoading(false);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!loading) {
      loadFilteredData(debouncedQuery, filterSection);
    }
  }, [debouncedQuery, filterSection]);

  const hierarchy = useMemo(() => {
    return data.departments.map((department) => ({
      ...department,
      programs: data.programs
        .filter((program) => program.department === department.id)
        .map((program) => ({
          ...program,
          sections: data.sections
            .filter((section) => section.program === program.id)
            .map((section) => ({
              ...section,
              courses: data.courses.filter((course) => course.section === section.id),
            })),
        })),
    }));
  }, [data]);

  const coursesForEnrollment = filterSection ? data.courses.filter((course) => String(course.section) === filterSection) : data.courses;

  if (!user) return <p>Please sign in.</p>;
  if (user.role !== "registrar" && user.role !== "admin") return <p>Not authorized.</p>;
  if (loading) return <div className="page role-page"><p>Loading academic tools...</p></div>;

  const createResource = async (event, key, endpoint, emptyState, successLabel, transform = (value) => value) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.post(endpoint, transform(forms[key]));
      setForms((current) => ({ ...current, [key]: emptyState }));
      setNotice(successLabel);
      await loadResources();
    } catch (err) {
      setError(apiMessage(err, successLabel.replace(".", " failed.")));
    }
  };

  const deleteRecord = async (endpoint, label) => {
    setError("");
    setNotice("");
    try {
      await api.delete(endpoint);
      setNotice(`${label} removed.`);
      await loadResources();
    } catch (err) {
      setError(apiMessage(err, `Could not remove ${label.toLowerCase()}.`));
    }
  };

  const patchCourse = async (course, patch) => {
    setError("");
    setNotice("");
    try {
      await api.patch(`/courses/items/${course.id}/`, patch);
      setNotice(`Updated ${course.code}.`);
      await loadResources();
    } catch (err) {
      setError(apiMessage(err, "Failed to update course."));
    }
  };

  return (
    <div className="role-workspace registrar-theme">
      <div className="page role-page academic-structure-page">
        <header className="role-page-header registrar-accent">
          <div>
            <p className="role-page-kicker">Academic Management</p>
            <h1>Academic Structure</h1>
            <p className="role-page-subtitle">Build the college hierarchy, assign classrooms, place students in sections, and connect teachers through section courses.</p>
          </div>
          <Link to="/" className="role-page-link">Back to Dashboard</Link>
        </header>

        <section className="academic-toolbar">
          <label className="table-search">
            <span>Search structure</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Department, program, section, course..." />
          </label>
          <label className="table-search">
            <span>Filter by section</span>
            <select value={filterSection} onChange={(event) => setFilterSection(event.target.value)}>
              <option value="">All sections</option>
              {data.sections.map((section) => (
                <option key={section.id} value={section.id}>{section.label || section.name}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="role-metric-grid">
          <article className="role-metric-card"><h3>{data.departments.length}</h3><p>Departments</p></article>
          <article className="role-metric-card"><h3>{data.programs.length}</h3><p>Programs</p></article>
          <article className="role-metric-card"><h3>{data.sections.length}</h3><p>Sections</p></article>
          <article className="role-metric-card"><h3>{data.classrooms.length}</h3><p>Classrooms</p></article>
        </section>

        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="notice">{notice}</p> : null}

        <section className="role-two-col">
          <article className="role-table-card">
            <h2>Create & Manage Sections</h2>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "section", "/courses/sections/", emptySection, "Section created.")}>
              <select value={forms.section.program} onChange={(event) => setForm("section", { program: event.target.value })} required>
                <option value="">Program</option>
                {data.programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={forms.section.academic_year} onChange={(event) => setForm("section", { academic_year: event.target.value })} required>
                <option value="">Academic year</option>
                {data.years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={forms.section.semester} onChange={(event) => setForm("section", { semester: event.target.value })} required>
                <option value="">Semester</option>
                {data.semesters.map((item) => <option key={item.id} value={item.id}>{item.academic_year_name} - {item.name}</option>)}
              </select>
              <input value={forms.section.name} onChange={(event) => setForm("section", { name: event.target.value })} placeholder="Section name" required />
              <input type="number" min="1" value={forms.section.year_level} onChange={(event) => setForm("section", { year_level: event.target.value })} placeholder="Year" />
              <input type="number" min="1" value={forms.section.capacity} onChange={(event) => setForm("section", { capacity: event.target.value })} placeholder="Capacity" />
              <button type="submit">Create Section</button>
            </form>
            <div className="mini-card-list">
              {visibleSections.map((section) => (
                <button type="button" className="mini-card" key={section.id} onClick={() => setFilterSection(String(section.id))}>
                  <strong>{section.label || section.name}</strong>
                  <span>{section.department_name} · {section.semester_name || "No semester"}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="role-table-card">
            <h2>Classrooms</h2>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "classroom", "/courses/classrooms/", emptyClassroom, "Classroom created.", (value) => ({ ...value, department: value.department || null }))}>
              <input value={forms.classroom.name} onChange={(event) => setForm("classroom", { name: event.target.value })} placeholder="Room name" required />
              <input value={forms.classroom.building} onChange={(event) => setForm("classroom", { building: event.target.value })} placeholder="Building" />
              <input type="number" min="1" value={forms.classroom.capacity} onChange={(event) => setForm("classroom", { capacity: event.target.value })} />
              <select value={forms.classroom.department} onChange={(event) => setForm("classroom", { department: event.target.value })}>
                <option value="">Department</option>
                {data.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button type="submit">Create Classroom</button>
            </form>
            <div className="mini-card-list">
              {data.classrooms.map((room) => (
                <div className="mini-card static" key={room.id}>
                  <strong>{room.name}</strong>
                  <span>{room.building || "Main campus"} · {room.capacity} seats</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="role-two-col">
          <article className="role-table-card">
            <h2>Create Department, Program, Year</h2>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "department", "/courses/departments/", emptyDepartment, "Department created.")}>
              <input value={forms.department.name} onChange={(event) => setForm("department", { name: event.target.value })} placeholder="Department name" required />
              <button type="submit">Create Department</button>
            </form>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "program", "/courses/programs/", emptyProgram, "Program created.")}>
              <select value={forms.program.name} onChange={(event) => setForm("program", { name: event.target.value })} required>
                <option value="">Program name</option>
                <option value="Regular">Regular</option>
                <option value="Weekend">Weekend</option>
                <option value="Extension">Extension</option>
              </select>
              <select value={forms.program.department} onChange={(event) => setForm("program", { department: event.target.value })} required>
                <option value="">Department</option>
                {data.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <button type="submit">Create Program</button>
            </form>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "year", "/courses/academic-years/", emptyYear, "Academic year created.")}>
              <input value={forms.year.name} onChange={(event) => setForm("year", { name: event.target.value })} placeholder="Academic year" required />
              <button type="submit">Create Year</button>
            </form>
            <form className="form-grid polished-form compact-form" onSubmit={(event) => createResource(event, "semester", "/courses/semesters/", emptySemester, "Semester created.")}>
              <input value={forms.semester.name} onChange={(event) => setForm("semester", { name: event.target.value })} placeholder="Semester name" required />
              <select value={forms.semester.academic_year} onChange={(event) => setForm("semester", { academic_year: event.target.value })} required>
                <option value="">Academic year</option>
                {data.years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input type="number" min="1" value={forms.semester.number} onChange={(event) => setForm("semester", { number: event.target.value })} />
              <button type="submit">Create Semester</button>
            </form>
          </article>

          <article className="role-table-card">
            <h2>Create Course</h2>
            <form className="form-grid polished-form" onSubmit={(event) => createResource(event, "course", "/courses/items/", emptyCourse, "Course created.", (value) => ({ ...value, program: value.program || null, section: value.section || null, semester: value.semester || null, teacher: value.teacher || null }))}>
              <input value={forms.course.code} onChange={(event) => setForm("course", { code: event.target.value })} placeholder="Course code" required />
              <input value={forms.course.name} onChange={(event) => setForm("course", { name: event.target.value })} placeholder="Course name" required />
              <input type="number" min="1" max="12" value={forms.course.credit_hour} onChange={(event) => setForm("course", { credit_hour: event.target.value })} />
              <select value={forms.course.section} onChange={(event) => {
                const section = data.sections.find((item) => String(item.id) === event.target.value);
                setForm("course", { section: event.target.value, program: section?.program || "", semester: section?.semester || "" });
              }} required>
                <option value="">Section</option>
                {data.sections.map((item) => <option key={item.id} value={item.id}>{item.label || item.name}</option>)}
              </select>
              <select value={forms.course.teacher} onChange={(event) => setForm("course", { teacher: event.target.value })}>
                <option value="">Unassigned teacher</option>
                {data.teachers.map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
              </select>
              <button type="submit">Create Course</button>
            </form>
          </article>
        </section>

        <section className="role-two-col">
          <article className="role-table-card">
            <h2>Enroll Student</h2>
            <form className="form-grid polished-form" onSubmit={(event) => createResource(event, "enrollment", "/courses/enrollments/", emptyEnrollment, "Student enrolled.")}>
              <select value={enrollSection} onChange={(event) => {
                setEnrollSection(event.target.value);
                setForm("enrollment", { student: "", course: "" });
              }}>
                <option value="">Select Section</option>
                {data.sections.map((item) => <option key={item.id} value={item.id}>{item.label || item.name}</option>)}
              </select>
              <select value={forms.enrollment.student} onChange={(event) => setForm("enrollment", { student: event.target.value })} required disabled={!enrollSection}>
                <option value="">Student</option>
                {data.students
                  .filter((s) => String(s.section) === String(enrollSection))
                  .map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
              </select>
              <select value={forms.enrollment.course} onChange={(event) => setForm("enrollment", { course: event.target.value })} required disabled={!enrollSection}>
                <option value="">Course</option>
                {data.courses
                  .filter((c) => String(c.section) === String(enrollSection))
                  .map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}
              </select>
              <input value={forms.enrollment.term} onChange={(event) => setForm("enrollment", { term: event.target.value })} placeholder="Term" required />
              <button type="submit">Create Enrollment</button>
            </form>
          </article>
        </section>

        <section className="role-table-card">
          <h2>Course Assignment Matrix</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Section</th><th>Teacher</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleCourses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{course.section_name || "No section"}</td>
                    <td>
                      <select value={course.teacher || ""} onChange={(event) => patchCourse(course, { teacher: event.target.value || null })}>
                        <option value="">Unassigned</option>
                        {data.teachers.map((item) => <option key={item.id} value={item.id}>{optionLabel(item)}</option>)}
                      </select>
                    </td>
                    <td><button type="button" className="tiny-btn danger-btn" onClick={() => deleteRecord(`/courses/items/${course.id}/`, "Course")}>Delete</button></td>
                  </tr>
                ))}
                {!visibleCourses.length ? <tr><td colSpan="5">No courses match the current filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="role-table-card">
          <h2>Enrollment Register</h2>
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr><th>Student</th><th>Course</th><th>Section</th><th>Term</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleEnrollments.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.student_name}</td>
                    <td>{entry.course_code}</td>
                    <td>{entry.section_name}</td>
                    <td>{entry.term}</td>
                    <td><button type="button" className="tiny-btn danger-btn" onClick={() => deleteRecord(`/courses/enrollments/${entry.id}/`, "Enrollment")}>Delete</button></td>
                  </tr>
                ))}
                {!visibleEnrollments.length ? <tr><td colSpan="5">No enrollments match the current filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
