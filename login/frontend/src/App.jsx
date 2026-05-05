import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MarketPlace from "./components/MarketPlace";
import Inbox from "./components/Inbox";
import NotificationListener from "./components/NotificationListener";
import GateBuddy from "./components/GateBuddy";
import GateRequests from "./components/GateRequests";
import useFCM from "./hooks/useFCM.jsx";

// A simple PrivateRoute component to protect the dashboard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // Request push notification permission and register FCM token
  useFCM();

  return token ? (
    <>
      <NotificationListener />
      {children}
    </>
  ) : (
    <Navigate to="/" />
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace"
          element={
            <PrivateRoute>
              <MarketPlace />
            </PrivateRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <PrivateRoute>
              <Inbox />
            </PrivateRoute>
          }
        />
        <Route
          path="/gate-buddy"
          element={
            <PrivateRoute>
              <GateBuddy />
            </PrivateRoute>
          }
        />
        <Route
          path="/gate-requests"
          element={
            <PrivateRoute>
              <GateRequests />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
