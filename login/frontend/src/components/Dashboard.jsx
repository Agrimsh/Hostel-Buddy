import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Dark mode state - initialize from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else {
          setError(result.message);
          if (response.status === 401) {
            handleLogout();
          }
        }
      } catch (err) {
        setError("Failed to fetch dashboard data.");
      }
    };

    if (API_URL) {
      fetchDashboardData();
    }
  }, [API_URL]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <div className="dashboard">
        {/* Top bar */}
        <header className="dashboard-header glass">
          <div className="header-brand">
            <span className="brand-icon"></span>
            <h2>Hostel Buddy</h2>
          </div>

          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark Mode"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="dashboard-main">
          <div className="welcome-section">
            <h1 className="gradient-text">Hey, Buddy 👋</h1>
            <p className="dashboard-subtitle">
              Welcome back, <span className="highlight-text">{user.email ? user.email.split('@')[0] : "User"}</span>
            </p>
          </div>

          <div className="services-container">
            <h3 className="section-title">Your Campus Services</h3>
            <div className="card-grid">

              <div className="dashboard-card glass-card" onClick={() => navigate('/marketplace')}>
                <div className="card-icon gradient-bg-1">💸</div>
                <div className="card-content">
                  <h3>Market Place</h3>
                  <p>Buy & sell campus essentials safely.</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

              <div className="dashboard-card glass-card">
                <div className="card-icon gradient-bg-2">🚪</div>
                <div className="card-content">
                  <h3>Gate Buddy</h3>
                  <p>Coming soon...</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

              <div className="dashboard-card glass-card">
                <div className="card-icon gradient-bg-3">🥤</div>
                <div className="card-content">
                  <h3>Vending Pending</h3>
                  <p>Coming soon...</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

              <div className="dashboard-card glass-card" onClick={() => navigate('/inbox')}>
                <div className="card-icon gradient-bg-4">💬</div>
                <div className="card-content">
                  <h3>Inbox</h3>
                  <p>View & reply to your marketplace messages.</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
