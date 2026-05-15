import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MarketPlace from "./components/MarketPlace";
import Inbox from "./components/Inbox";
import NotificationListener from "./components/NotificationListener";
import GateBuddy from "./components/GateBuddy";
import NotificationPrompt from "./components/NotificationPrompt";
import useFCM from "./hooks/useFCM.jsx";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import UsersModeration from "./components/admin/UsersModeration";
import MarketplaceModeration from "./components/admin/MarketplaceModeration";
import GateBuddyModeration from "./components/admin/GateBuddyModeration";

// Role-based route wrapper
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) return <Navigate to="/" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin" && user.role !== "warden") {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  } catch (error) {
    return <Navigate to="/" replace />;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
};

// Top-level component using hooks
const AppContent = () => {
  // Call hooks unconditionally
  useFCM();

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <NotificationListener />
      <NotificationPrompt />

      <Routes>
        <Route path="/" element={<Login />} />

        {/* Regular User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MarketPlace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate-buddy"
          element={
            <ProtectedRoute>
              <GateBuddy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Navigate to="/admin/users" replace />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <UsersModeration />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/marketplace"
          element={
            <AdminRoute>
              <AdminLayout>
                <MarketplaceModeration />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/gate-buddy"
          element={
            <AdminRoute>
              <AdminLayout>
                <GateBuddyModeration />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Catch all unhandled routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
