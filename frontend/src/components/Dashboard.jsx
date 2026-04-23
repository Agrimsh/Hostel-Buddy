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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="title" style={{margin: 0}}>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div style={{ padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
        <h2>Welcome back, {user.email}!</h2>
        <p style={{ marginTop: "10px", color: "#4b5563" }}>
          You have successfully authenticated using the OTP system.
        </p>

        {error && <p className="error-msg">{error}</p>}
        
        {data && (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
            <h3 style={{ color: "#1e3a8a", marginBottom: "10px" }}>Protected Server Response:</h3>
            <pre style={{ overflowX: "auto" }}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
