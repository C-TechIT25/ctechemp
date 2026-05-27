import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import EmployeeApp from "./Pages/CreateEmployee";
import EmployeePublicProfile from "./Pages/EmployeePublicProfile"; // 👈 public page

// 🔹 Lazy loaded pages
const Login            = lazy(() => import("./Pages/Login"));
const UserManagement   = lazy(() => import("./Pages/UserManagement"));
const Reports          = lazy(() => import("./Pages/Reports"));
const DailyTimesheet   = lazy(() => import("./Pages/DailyTimesheet"));
const Todo             = lazy(() => import("./Pages/Todo"));
const Timesheet        = lazy(() => import("./Pages/Timesheet"));
const NotificationsPage= lazy(() => import("./Pages/Notification"));
const Profile          = lazy(() => import("./Pages/Profile"));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
        <Routes>

          {/* ROOT REDIRECT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ─── PUBLIC ROUTES (no auth needed) ─────────────────────────── */}
          <Route path="/login" element={<Login />} />

          {/* QR scan lands here — fully public, no login required */}
          {/* This uses hash router format: /#/employee/profile/:id */}
          <Route path="/employee/profile/:id" element={<EmployeePublicProfile />} />

          {/* ─── PROTECTED ROUTES ────────────────────────────────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* ADMIN */}
            <Route path="/admin/users"            element={<UserManagement />} />
            <Route path="/admin/timesheet"         element={<Timesheet />} />
            <Route path="/admin/reports"           element={<Reports />} />
            <Route path="/admin/create-employee"   element={<EmployeeApp />} />

            {/* EMPLOYEE */}
            <Route path="/employee/daily-timesheet" element={<DailyTimesheet />} />
            <Route path="/employee/todo"            element={<Todo />} />
            <Route path="/notifications"            element={<NotificationsPage />} />
            <Route path="/profile"                  element={<Profile />} />
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Suspense>
    </AuthProvider>
  );
}