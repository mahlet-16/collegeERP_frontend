import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import CreateTimetablePage from "./pages/CreateTimetablePage";
import TeacherManagePage from "./pages/TeacherManagePage";
import StudentViewPage from "./pages/StudentViewPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import AdminMonitorPage from "./pages/AdminMonitorPage";

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
        path="/users/create"
        element={
          <ProtectedRoute>
            <RegisterUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timetable/create"
        element={
          <ProtectedRoute>
            <CreateTimetablePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/manage"
        element={
          <ProtectedRoute>
            <TeacherManagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/view"
        element={
          <ProtectedRoute>
            <StudentViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/config"
        element={
          <ProtectedRoute>
            <AdminConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/monitor"
        element={
          <ProtectedRoute>
            <AdminMonitorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
