import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";

// 🔹 Lazy loaded pages (BIG performance win)
const Login = lazy(() => import("./Pages/Login"));
const UserManagement = lazy(() => import("./Pages/UserManagement"));
const Reports = lazy(() => import("./Pages/Reports"));
const DailyTimesheet = lazy(() => import("./Pages/DailyTimesheet"));
const Todo = lazy(() => import("./Pages/Todo"));
const Timesheet = lazy(() => import("./Pages/Timesheet"));
const NotificationsPage = lazy(() => import("./Pages/Notification"));
const Profile = lazy(() => import("./Pages/Profile"));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
        <Routes>
          {/* ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTES */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* ADMIN */}
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/timesheet" element={<Timesheet />} />
            <Route path="/admin/reports" element={<Reports />} />

            {/* EMPLOYEE */}
            <Route
              path="/employee/daily-timesheet"
              element={<DailyTimesheet />}
            />
            <Route path="/employee/todo" element={<Todo />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
