import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const COLLEGE_DOMAIN = "@galgotiasuniversity.ac.in";

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Auto-redirect if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation: college email only
    if (!email.toLowerCase().endsWith(COLLEGE_DOMAIN)) {
      setError("Please use your Galgotias University email (e.g., Name.ID@galgotiasuniversity.ac.in)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // Move to OTP verification step
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Server connection failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem("token", data.token);
        // Store some basic user info if needed
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect based on role — admins/wardens go to admin portal
        if (data.user.role === "admin" || data.user.role === "warden") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch (err) {
      setError("Server connection failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInDown 0.8s ease-out' }}>
        <h1 className="title" style={{ fontSize: '3rem', color: '#10b981', textShadow: '0 5px 0 #047857', marginBottom: '0.5rem', lineHeight: '1.1' }}>
          Welcome to Hostel Buddy
        </h1>
        <p className="subtitle" style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Your Hostel Companion
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <h2 style={{ textAlign: 'center', color: '#f1f5f9', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Sign In</h2>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Use your Galgotias University email</p>

            <label className="label">College Email</label>
            <input
              type="email"
              className="input"
              placeholder="e.g., rahul.23SCSE1011348@galgotiasuniversity.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Sending..." : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <label className="label">Enter 6-digit OTP</label>
            <input
              type="text"
              maxLength="6"
              className="input"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              <p className="error-msg" style={{ color: '#94a3b8', fontSize: '13px', margin: 0, wordBreak: 'break-all', textAlign: 'center' }}>
                Sent to: <span style={{ color: '#f1f5f9', fontWeight: '500' }}>{email}</span>
              </p>
              <span 
                style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }} 
                onClick={() => { setStep(1); setOtp(""); setError(""); }}
              >
                Change Email
              </span>
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn" disabled={loading || otp.length < 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;

