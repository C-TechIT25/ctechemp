import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./Pages/UserManagement";
import Reports from "./Pages/Reports";
import DailyTimesheet from "./Pages/DailyTimesheet";
import Todo from "./Pages/Todo";
import AdminDashboard from "./Pages/AdminDashboard";
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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* ADMIN */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/timesheet" element={<Timesheet />} />
            <Route path="admin/reports" element={<Reports />}/>

            {/* EMPLOYEE */}
            <Route path="employee/daily-timesheet" element={<DailyTimesheet />} />
            <Route path="employee/todo" element={<Todo/>} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
