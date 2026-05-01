import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import useForceLogout from "./hooks/useForceLogout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Department from "./pages/Department";
import Employee from "./pages/Employee";
import PermissionPortal from "./pages/PermissionPortal";
import Salary from "./pages/Salary";
import Reports from "./pages/Reports";
import Messages from "./pages/Messages";
import UsersManagement from "./pages/UsersManagement";
import Announcements from "./pages/Announcements";
import EmployeePortal from "./pages/EmployeePortal";
import Suggestions from "./pages/Suggestions";
import AdminSettings from "./pages/AdminSettings";
import ActivityTimeline from "./pages/ActivityTimeline";
import Profile from "./pages/Profile";

const PUBLIC = ["/login", "/register"];

const DashboardRouter = () => {
  const { user } = useAuth();
  return user?.role === "employee" ? <EmployeePortal /> : <Dashboard />;
};

const ForceLogoutWrapper = ({ children }) => {
  useForceLogout();
  return children;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isPublic = PUBLIC.includes(location.pathname);
  return (
    <div className="min-h-screen flex flex-col bg-panel-100">
      {!isPublic && <Navbar />}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        ${isPublic ? "" : "pt-20 pb-6"}`}
      >
        {children}
      </main>
      {!isPublic && <Footer />}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <ForceLogoutWrapper>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/announcements"
                element={
                  <ProtectedRoute>
                    <Announcements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suggestions"
                element={
                  <ProtectedRoute>
                    <Suggestions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/department"
                element={
                  <ProtectedRoute roles={["admin", "hr"]}>
                    <Department />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee"
                element={
                  <ProtectedRoute roles={["admin", "hr"]}>
                    <Employee />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/salary"
                element={
                  <ProtectedRoute roles={["admin", "hr"]}>
                    <Salary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={["admin", "hr"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <ActivityTimeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/permissions"
                element={
                  <ProtectedRoute roles={["admin", "hr"]}>
                    <PermissionPortal />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </ForceLogoutWrapper>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
