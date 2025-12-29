import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./Pages/UserManagement";
import Reports from "./Pages/Reports";
import DailyTimesheet from "./Pages/DailyTimesheet";
import Todo from "./Pages/Todo";
import Timesheet from "./Pages/Timesheet";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ✅ ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTES WITH DASHBOARD LAYOUT */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* ADMIN ROUTES */}
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/timesheet" element={<Timesheet />} />
            <Route path="/admin/reports" element={<Reports />} />

            {/* EMPLOYEE ROUTES */}
            <Route path="/employee/daily-timesheet" element={<DailyTimesheet />} />
            <Route path="/employee/todo" element={<Todo />} />

            {/* DEFAULT REDIRECT BASED ON ROLE - Handled in Login */}
            <Route path="/" element={<NavigateToRoleBasedPage />} />
          </Route>

          {/* CATCH ALL ROUTE */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Component to redirect based on role (if user visits root after login)
function NavigateToRoleBasedPage() {
  // This is a fallback. Actual redirection happens in Login component
  return <Navigate to="/login" replace />;
}