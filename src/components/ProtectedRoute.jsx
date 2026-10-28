import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageSkeleton from "./PageSkeleton";

const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  const { user, role, loading, authInitialized } = useAuth();

  // Keep the app shell stable while authentication is restored.
  if (loading || !authInitialized) {
    return <PageSkeleton fullScreen />;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  const doesNotHaveRequiredRole = requiredRole && role !== requiredRole;
  const isOutsideAllowedRoles = allowedRoles?.length > 0 && !allowedRoles.includes(role);

  if (doesNotHaveRequiredRole || isOutsideAllowedRoles) {
    // Redirect to appropriate dashboard based on role
    if (["Admin", "SuperAdmin"].includes(role)) {
      return <Navigate to="/admin/users" replace />;
    } else {
      return <Navigate to="/employee/daily-timesheet" replace />;
    }
  }

  // User is authenticated and has required role (if specified)
  return children;
};

export default ProtectedRoute;
