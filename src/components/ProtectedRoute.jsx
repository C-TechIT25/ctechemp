import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ✅ Wait for Firebase auth check to finish before deciding
  if (loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center",
        alignItems: "center", height: "100vh",
        fontFamily: "sans-serif", color: "#64748b", fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  // ✅ Not logged in → go to login
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;