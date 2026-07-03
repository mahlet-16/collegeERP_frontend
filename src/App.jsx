import { Navigate, Route, Routes } from "react-router-dom";

import AdminConfigPage from "./pages/AdminConfigPage";
import AdminMonitorPage from "./pages/AdminMonitorPage";
import CreateTimetablePage from "./pages/CreateTimetablePage";
import ExamSchedulePage from "./pages/ExamSchedulePage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import RegistrarAcademicPage from "./pages/RegistrarAcademicPage";
import StudentViewPage from "./pages/StudentViewPage";
import TeacherManagePage from "./pages/TeacherManagePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/view"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/manage"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherManagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/register"
        element={
          <ProtectedRoute roles={["registrar"]}>
            <RegisterUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/timetable"
        element={
          <ProtectedRoute roles={["registrar"]}>
            <CreateTimetablePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/exams"
        element={
          <ProtectedRoute roles={["registrar"]}>
            <ExamSchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/academics"
        element={
          <ProtectedRoute roles={["registrar"]}>
            <RegistrarAcademicPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/monitor"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminMonitorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
