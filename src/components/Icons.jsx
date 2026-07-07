const paths = {
  dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
  students: "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3ZM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.67 0-5 1.34-5 3v2h10v-2c0-1.66-2.33-3-5-3Zm8 0c-.45 0-.9.04-1.32.12.83.73 1.32 1.7 1.32 2.88v2h5v-2c0-1.66-2.33-3-5-3Z",
  teachers: "M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm0 14.2L5 13.38V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.62l-7 3.82Z",
  registrar: "M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5M9 13h8M9 17h8M9 9h3",
  courses: "M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Zm4 4h8M8 12h8M8 16h5",
  sections: "M4 5h16v4H4V5Zm0 6h7v8H4v-8Zm9 0h7v8h-7v-8Z",
  timetable: "M7 2v3M17 2v3M4 8h16M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1Zm3 8h3v3H8v-3Zm5 0h3v3h-3v-3Z",
  attendance: "M9 11 12 14 20 6M20 12v7H4V5h11",
  results: "M5 3h14v18H5V3Zm4 5h6M9 12h6M9 16h3",
  departments: "M3 21V7l9-4 9 4v14h-6v-6H9v6H3Zm6-10h2V9H9v2Zm4 0h2V9h-2v2Z",
  reports: "M4 19h16v2H4v-2Zm2-2V9h3v8H6Zm5 0V3h3v14h-3Zm5 0v-6h3v6h-3Z",
  settings: "M19.4 13.5a7.8 7.8 0 0 0 0-3l2.1-1.6-2-3.4-2.5 1a8.6 8.6 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.6 8.6 0 0 0-2.6 1.5l-2.5-1-2 3.4 2.1 1.6a7.8 7.8 0 0 0 0 3l-2.1 1.6 2 3.4 2.5-1a8.6 8.6 0 0 0 2.6 1.5l.4 3h4l.4-3a8.6 8.6 0 0 0 2.6-1.5l2.5 1 2-3.4-2.1-1.6ZM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c0-3.31 3.13-6 7-6s7 2.69 7 6H5Z",
  notifications: "M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-4 4h-4",
  users: "M7 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm10 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM2 21c0-4 2.69-7 6-7s6 3 6 7H2Zm12.5 0c-.22-1.62-.83-3.04-1.75-4.13A5.3 5.3 0 0 1 17 15c2.76 0 5 2.69 5 6h-7.5Z",
  structure: "M12 3v4M6 11H3v8h6v-8H6Zm15 0h-6v8h6v-8ZM9 7h6v4M6 11V7h12v4",
  logout: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
  exams: "M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5M9 13h8M9 17h4",
  monitoring: "M3 12h4l2-6 4 12 2-6h6",
  moon: "M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z",
  sun: "M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
};

export default function Icon({ name, className = "icon", title }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label={title || name}>
      <path d={paths[name] || paths.dashboard} fill="currentColor" />
    </svg>
  );
}
