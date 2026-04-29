import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import "./GateRequests.css";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

const GateRequests = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myUsername = user.email ? user.email.split("@")[0] : "";
  const token = localStorage.getItem("token");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incoming"); // "incoming" | "outgoing"
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  // ── Socket — live-update requests when trips change ─────────
  useEffect(() => {
    const s = io(SOCKET_URL);

    s.on("gateTripUpdated", () => fetchRequests());
    s.on("newGateTrip", () => fetchRequests());

    return () => s.disconnect();
  }, []);

  // ── Fetch requests ─────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/gate/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Approve ────────────────────────────────────────────────
  const handleApprove = async (tripId, bookingId) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_URL}/gate/trips/${tripId}/bookings/${bookingId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Booking approved!");
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject ─────────────────────────────────────────────────
  const handleReject = async (tripId, bookingId) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_URL}/gate/trips/${tripId}/bookings/${bookingId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("❌ Booking rejected");
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const incomingRequests = requests.filter((r) => r.role === "picker");
  const outgoingRequests = requests.filter((r) => r.role === "booker");
  const activeList = tab === "incoming" ? incomingRequests : outgoingRequests;
  const pendingCount = incomingRequests.filter((r) => r.status === "PENDING").length;

  const statusConfig = {
    PENDING:  { label: "Pending",  icon: "🟡", cls: "gr-status-pending" },
    APPROVED: { label: "Approved", icon: "🟢", cls: "gr-status-approved" },
    REJECTED: { label: "Rejected", icon: "🔴", cls: "gr-status-rejected" },
  };

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <div className="gr-page">

        {/* Header — matches Inbox header */}
        <header className="dashboard-header glass">
          <div className="header-left header-brand">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              <span>&larr;</span>
            </button>
            <h2>
              Gate Requests
              {pendingCount > 0 && <span className="gr-header-badge">{pendingCount}</span>}
            </h2>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="gr-content">

          {/* Tabs */}
          <div className="gr-tabs">
            <button
              className={`gr-tab ${tab === "incoming" ? "active" : ""}`}
              onClick={() => setTab("incoming")}
            >
              📥 Incoming
              {pendingCount > 0 && <span className="gr-tab-badge">{pendingCount}</span>}
            </button>
            <button
              className={`gr-tab ${tab === "outgoing" ? "active" : ""}`}
              onClick={() => setTab("outgoing")}
            >
              📤 My Bookings
            </button>
            <button className="gr-refresh" onClick={fetchRequests}>↻</button>
          </div>

          {/* List */}
          {loading ? (
            <div className="gr-empty">
              <div className="gr-spinner" />
              <p>Loading requests…</p>
            </div>
          ) : activeList.length === 0 ? (
            <div className="gr-empty">
              <span className="gr-empty-icon">{tab === "incoming" ? "📥" : "📤"}</span>
              <h3>{tab === "incoming" ? "No incoming requests" : "No bookings yet"}</h3>
              <p>
                {tab === "incoming"
                  ? "Post a trip on Gate Buddy and wait for bookings!"
                  : "Browse the live feed to book a picker."}
              </p>
              <button className="gr-goto-btn" onClick={() => navigate("/gate-buddy")}>
                🚪 Go to Gate Buddy
              </button>
            </div>
          ) : (
            <div className="gr-list">
              {activeList.map((req) => {
                const sc = statusConfig[req.status] || statusConfig.PENDING;
                const isActing = actionLoading === req.bookingId;
                return (
                  <div key={req.bookingId} className={`gr-card glass-card ${req.status === "PENDING" ? "gr-card-pending" : ""}`}>
                    {/* Top row */}
                    <div className="gr-card-top">
                      <div className="gr-avatar">
                        {tab === "incoming"
                          ? (req.bookerName || req.booker || "?")[0].toUpperCase()
                          : (req.pickerName || req.picker || "?")[0].toUpperCase()}
                      </div>
                      <div className="gr-card-info">
                        <span className="gr-card-name">
                          {tab === "incoming" ? (req.bookerName || req.booker) : (req.pickerName || req.picker)}
                        </span>
                        <span className="gr-card-meta">
                          {tab === "incoming"
                            ? `Room ${req.bookerRoom || "?"} · ₹${req.price}`
                            : `Room ${req.pickerRoom} · ₹${req.price}`}
                        </span>
                        <span className="gr-card-time">{timeAgo(req.bookedAt)}</span>
                      </div>
                      <div className={`gr-status ${sc.cls}`}>
                        <span>{sc.icon}</span> {sc.label}
                      </div>
                    </div>

                    {/* Order details */}
                    {req.orderDetails && (
                      <div className="gr-order">
                        <span className="gr-order-label">Order</span>
                        <span className="gr-order-text">
                          {req.orderDetails} {req.orderPrice !== undefined && `(₹${req.orderPrice})`}
                        </span>
                      </div>
                    )}

                    {/* Actions — only for picker on PENDING */}
                    {tab === "incoming" && req.status === "PENDING" && (
                      <div className="gr-actions">
                        <button
                          className="gr-approve"
                          onClick={() => handleApprove(req.tripId, req.bookingId)}
                          disabled={isActing}
                        >
                          {isActing ? "…" : "✅ Approve"}
                        </button>
                        <button
                          className="gr-reject"
                          onClick={() => handleReject(req.tripId, req.bookingId)}
                          disabled={isActing}
                        >
                          {isActing ? "…" : "❌ Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GateRequests;
