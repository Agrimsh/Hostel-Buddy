import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Dark mode state - initialize from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // UPI settings
  const [upiId, setUpiId] = useState("");
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiEditing, setUpiEditing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

  // Load UPI ID from profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.profile.upiId) {
          setUpiId(data.profile.upiId);
        }
      } catch {}
    };
    if (token) loadProfile();
  }, [API_URL, token]);

  const handleSaveUpi = async () => {
    setUpiSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile/upi`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ UPI ID saved!");
        setUpiEditing(false);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to save UPI ID");
    } finally {
      setUpiSaving(false);
    }
  };

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
            {user.role === "admin" && (
              <button 
                onClick={() => navigate("/admin")} 
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginRight: "0.5rem"
                }}
              >
                Admin Panel
              </button>
            )}
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

              <div className="dashboard-card glass-card" onClick={() => navigate('/gate-buddy')}>
                <div className="card-icon gradient-bg-2">🚪</div>
                <div className="card-content">
                  <h3>Gate Buddy</h3>
                  <p>Book hostlers to pick your order at the gate.</p>
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

          {/* UPI Settings */}
          <div className="services-container" style={{ marginTop: "1.5rem" }}>
            <h3 className="section-title">Payment Settings</h3>
            <div className="glass-card" style={{ padding: "1.2rem 1.5rem", borderRadius: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "1.5rem" }}>💳</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>UPI ID</h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.6 }}>
                    Used for Gate Buddy payments when you pick orders
                  </p>
                </div>
              </div>

              {upiEditing || !upiId ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm"
                    style={{
                      flex: 1,
                      padding: "0.6rem 1rem",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(99,102,241,0.3)",
                      background: "transparent",
                      color: "inherit",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSaveUpi}
                    disabled={upiSaving || !upiId.trim()}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      opacity: upiSaving || !upiId.trim() ? 0.5 : 1,
                    }}
                  >
                    {upiSaving ? "…" : "Save"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "10px",
                    background: "rgba(99,102,241,0.1)",
                    color: "#6366f1",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    flex: 1,
                  }}>
                    {upiId}
                  </span>
                  <button
                    onClick={() => setUpiEditing(true)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(99,102,241,0.3)",
                      background: "transparent",
                      color: "#6366f1",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
