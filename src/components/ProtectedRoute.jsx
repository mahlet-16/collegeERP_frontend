import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="center-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Layout>{children}</Layout>;
}

export default ProtectedRoute;
