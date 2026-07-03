import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="center-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return (
      <Layout>
        <div className="panel">
          <div className="empty-state">
            <strong>Access restricted</strong>
            <span>Your current role does not have permission to open this workspace.</span>
          </div>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

export default ProtectedRoute;
