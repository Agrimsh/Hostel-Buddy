import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
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
        // Redirect to dashboard
        navigate("/dashboard");
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
      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
             <h1 className="title">Welcome</h1>
             <p className="subtitle">Enter your email to receive a one-time password</p>

            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="e.g., john@gmail.com"
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
            <p className="error-msg" style={{color: '#6b7280', fontSize: '12px', marginTop: '10px'}}>
              Sent to {email} &bull; <span style={{cursor: 'pointer', color: '#3b82f6'}} onClick={() => {setStep(1); setOtp(""); setError("");}}>Change Email</span>
            </p>
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
