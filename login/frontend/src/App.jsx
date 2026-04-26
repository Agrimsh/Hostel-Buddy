import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import MarketPlace from "./components/MarketPlace";
import Inbox from "./components/Inbox";
import NotificationListener from "./components/NotificationListener";

// A simple PrivateRoute component to protect the dashboard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
