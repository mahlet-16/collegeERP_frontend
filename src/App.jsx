import { Navigate, Route, Routes } from "react-router-dom";

import AdminConfigPage from "./pages/AdminConfigPage";
import AdminMonitorPage from "./pages/AdminMonitorPage";
import CreateTimetablePage from "./pages/CreateTimetablePage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterUserPage from "./pages/RegisterUserPage";
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
          <ProtectedRoute>
            <StudentViewPage />
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
        path="/registrar/register"
        element={
          <ProtectedRoute>
            <RegisterUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registrar/timetable"
        element={
          <ProtectedRoute>
            <CreateTimetablePage />
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
