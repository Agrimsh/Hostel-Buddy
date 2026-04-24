import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // User state pulled from localStorage (saved during login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      
      try {
        // Example of a protected request to the backend
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          // If token is invalid or expired, log them out
          setError(result.message);
          if (response.status === 401) {
            handleLogout();
          }
        }
      } catch (err) {
        setError("Failed to fetch dashboard data.");
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

    return (
    <div className="dashboard">

      {/* Top bar */}
      <header className="dashboard-header">
        <h2>Hostel Buddy</h2>

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <h1>Hey, Buddy 👋</h1>
        <p className="subtitle">
          Welcome back {user.email || "User"}
        </p>

        {/* Simple cards */}
        <div className="card-grid">
          <div className="card">💸 Market Place</div>
          <div className="card">🚪 Gate Buddy</div>
          <div className="card">🥤 Vending Pending</div>
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
