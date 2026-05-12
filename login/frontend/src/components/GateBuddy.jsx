import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import { formatName } from "../utils/formatName";
import "./GateBuddy.css";
import "./GateRequests.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

const GateBuddy = () => {
  const navigate = useNavigate();
  const [isDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myUsername = user.email ? user.email.split("@")[0] : "";
  const token = localStorage.getItem("token");

  // ── State: Core ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("live"); // "live" | "myTrip" | "requests"
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // ── State: Trips ───────────────────────────────────────────
  const [trips, setTrips] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(null);
  const [postForm, setPostForm] = useState({ price: "", slots: 1, note: "", pickerName: formatName(user.email), pickerRoom: "", upiId: "" });
  const [bookForm, setBookForm] = useState({ orderDetails: "", bookerName: formatName(user.email), bookerRoom: "", orderPrice: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── State: Requests ────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [reqTab, setReqTab] = useState("incoming"); // "incoming" | "outgoing"
  const [actionLoading, setActionLoading] = useState(null);

  // ── State: Chat & UPI Modals ───────────────────────────────
  const [chatOpen, setChatOpen] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatSocketRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const [upiModal, setUpiModal] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showGuidelines, setShowGuidelines] = useState(false);

  // ── Socket Setup ───────────────────────────────────────────
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("newGateTrip", (trip) => {
      setTrips((prev) => [trip, ...prev]);
      fetchRequests(); // Also refresh requests just in case
      if (trip.picker !== myUsername) {
        toast.info(`🚪 ${trip.pickerName || trip.picker} is going to gate for ₹${trip.price}!`);
      }
    });

    s.on("gateTripUpdated", (updated) => {
      fetchRequests();
      setTrips((prev) =>
        updated.status === "active"
          ? prev.map((t) => (t._id === updated._id ? updated : t))
          : prev.filter((t) => t._id !== updated._id)
      );
    });

    s.on("gateTripRemoved", (tripId) => {
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
      fetchRequests();
    });

    return () => s.disconnect();
  }, [myUsername]);

  // ── Prefill UPI ────────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.profile.upiId) {
          setPostForm((prev) => ({ ...prev, upiId: data.profile.upiId }));
        }
      } catch { }
    };
    if (token) loadProfile();
  }, [token]);

  // ── Fetchers ───────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/gate/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTrips(data.trips);
    } catch {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/gate/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch {
      console.error("Failed to load requests");
    }
  }, [token]);

  useEffect(() => {
    fetchTrips();
    fetchRequests();
  }, [fetchTrips, fetchRequests]);

  // ── Trip Actions ───────────────────────────────────────────
  const handlePostTrip = async (e) => {
    e.preventDefault();
    if (!postForm.price || postForm.price <= 0) return toast.error("Enter a valid price");
    setSubmitting(true);
    try {
      if (postForm.upiId) {
        fetch(`${API_URL}/profile/upi`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ upiId: postForm.upiId }),
        }).catch(() => { });
      }

      const res = await fetch(`${API_URL}/gate/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(postForm),
      });
      const data = await res.json();
      if (data.success) {
        socket?.emit("gateTripPosted", data.trip);
        toast.success("🚪 You're live! Hostelmates have been notified.");
        setShowPostModal(false);
        setPostForm((prev) => ({ ...prev, price: "", note: "" }));
        setActiveTab("myTrip");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookTrip = async (e) => {
    e.preventDefault();
    if (!showBookModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/gate/trips/${showBookModal._id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bookForm),
      });
      const data = await res.json();
      if (data.success) {
        socket?.emit("gateTripBooked", data.trip);
        toast.success(`📋 Request sent! Check 'My Requests' tab.`);
        setShowBookModal(null);
        setBookForm({ orderDetails: "", bookerName: "", bookerRoom: "", orderPrice: "" });
        setActiveTab("requests");
        setReqTab("outgoing");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTrip = async (tripId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel your trip?")) return;

    try {
      console.log("Cancelling trip:", tripId);
      const res = await fetch(`${API_URL}/gate/trips/${tripId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Cancel response status:", res.status);
      const data = await res.json();
      console.log("Cancel response data:", data);

      if (data.success) {
        setTrips((prev) => prev.filter((t) => t._id !== tripId));
        socket?.emit("gateTripCancelled", tripId);
        toast.success("Trip cancelled successfully");
        setActiveTab("live");
      } else {
        toast.error(`Backend Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Cancel Trip Catch Error:", err);
      toast.error(`Network Error: ${err.message}`);
    }
  };

  // ── Request Actions ────────────────────────────────────────
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
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

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
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArrive = async (tripId, bookingId) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API_URL}/gate/trips/${tripId}/bookings/${bookingId}/arrive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("🏠 Order marked as arrived!");
        fetchRequests();
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to mark as arrived");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Chat Logic ─────────────────────────────────────────────
  const openChat = (req) => {
    setChatOpen(req);
    setChatMessages([]);
    setChatInput("");
    setChatLoading(true);
  };

  useEffect(() => {
    if (!chatOpen) return;
    const otherUser = chatOpen.role === "picker" ? chatOpen.booker : chatOpen.picker;
    const tripId = chatOpen.tripId;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/chat/history?sender=${myUsername}&receiver=${otherUser}&itemId=${tripId}`);
        const data = await res.json();
        if (data.success) setChatMessages(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setChatLoading(false);
      }
    })();

    const s = io(SOCKET_URL);
    chatSocketRef.current = s;
    s.emit("joinRoom", myUsername);

    s.on("receiveMessage", (msg) => {
      if (msg.itemId === tripId && ((msg.sender === myUsername && msg.receiver === otherUser) || (msg.sender === otherUser && msg.receiver === myUsername))) {
        setChatMessages((prev) => prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]);
      }
    });

    setTimeout(() => chatInputRef.current?.focus(), 300);
    return () => { s.disconnect(); chatSocketRef.current = null; };
  }, [chatOpen, myUsername]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleChatSend = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !chatSocketRef.current || !chatOpen) return;
    const otherUser = chatOpen.role === "picker" ? chatOpen.booker : chatOpen.picker;
    chatSocketRef.current.emit("sendMessage", {
      sender: myUsername, receiver: otherUser, message: text, itemId: chatOpen.tripId, itemTitle: "Gate Buddy Trip"
    });
    setChatInput("");
  };

  // ── UPI Logic ──────────────────────────────────────────────
  const openUpiModal = async (req) => {
    setUpiModal(req);
    setQrDataUrl("");
    const totalAmount = (Number(req.orderPrice) || 0) + (Number(req.price) || 0);
    const upiId = req.pickerUpiId;
    if (!upiId) return toast.error("Picker hasn't set their UPI ID yet.");

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(req.pickerName || req.picker)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Gate Buddy - ${req.orderDetails || "Order"}`)}`;
    try {
      const url = await QRCode.toDataURL(upiLink, { width: 280, margin: 2, color: { dark: "#1e293b", light: "#ffffff" } });
      setQrDataUrl(url);
    } catch (err) {
      toast.error("Failed to generate QR code");
    }
  };

  // ── Utility ────────────────────────────────────────────────
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const myActiveTrip = trips.find((t) => t.picker === myUsername);
  const incomingRequests = requests.filter((r) => r.role === "picker");
  const outgoingRequests = requests.filter((r) => r.role === "booker");
  const activeReqList = reqTab === "incoming" ? incomingRequests : outgoingRequests;
  const pendingCount = incomingRequests.filter((r) => r.status === "PENDING").length;

  const statusConfig = {
    PENDING: { label: "Pending", icon: "🟡", cls: "gr-status-pending" },
    APPROVED: { label: "Approved", icon: "🟢", cls: "gr-status-approved" },
    REJECTED: { label: "Rejected", icon: "🔴", cls: "gr-status-rejected" },
    ARRIVED: { label: "Arrived", icon: "🏠", cls: "gr-status-arrived" },
  };

  // ── Main Render ────────────────────────────────────────────
  return (
    <div className={`gatebuddy-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <header className="gb-header glass">
        <button className="gb-back-btn" onClick={() => navigate("/dashboard")}>← Back</button>
        <div className="gb-header-brand">
          <span className="gb-brand-icon">🚪</span>
          <span className="gb-brand-name">Gate Buddy</span>
        </div>
        <div style={{ width: "80px" }}>
          <button
            onClick={() => setShowGuidelines(true)}
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#a5b4fc",
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              transition: "all 0.2s ease"
            }}
          >
            ℹ️ Guide
          </button>
        </div>
      </header>

      <main className="gb-main">
        {/* Navigation Tabs */}
        <div className="gb-cta-group" style={{ marginBottom: "2rem" }}>
          <button
            className={activeTab === "live" ? "gb-btn-primary active" : "gb-btn-secondary"}
            onClick={() => setActiveTab("live")}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontWeight: "600" }}>📦 Live Feed</span>
            <span style={{ fontSize: "0.7rem", opacity: activeTab === "live" ? 0.9 : 0.7, marginTop: "4px", fontWeight: "normal" }}>Find a picker</span>
          </button>
          <button
            className={activeTab === "myTrip" ? "gb-btn-primary active" : "gb-btn-secondary"}
            onClick={() => myActiveTrip ? setActiveTab("myTrip") : setShowPostModal(true)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontWeight: "600" }}>{myActiveTrip ? "View My Trip" : "I'm Going to Gate"}</span>
            <span style={{ fontSize: "0.7rem", opacity: activeTab === "myTrip" ? 0.9 : 0.8, marginTop: "4px", fontWeight: "normal" }}>{myActiveTrip ? "Manage your trip" : "Post your trip"}</span>
          </button>
          <button
            className={activeTab === "requests" ? "gb-btn-primary active" : "gb-btn-secondary"}
            onClick={() => setActiveTab("requests")}
            style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontWeight: "600" }}>📋 My Requests</span>
            <span style={{ fontSize: "0.7rem", opacity: activeTab === "requests" ? 0.9 : 0.7, marginTop: "4px", fontWeight: "normal" }}>Track & chat</span>
            {pendingCount > 0 && <span className="gr-header-badge" style={{ position: "absolute", top: "-5px", right: "-5px", fontSize: "0.7rem", padding: "2px 6px" }}>{pendingCount}</span>}
          </button>
        </div>

        {/* ── LIVE FEED TAB ── */}
        {activeTab === "live" && (
          <section className="gb-feed-section" id="gb-feed">
            <div className="gb-feed-header">
              <h2 className="gb-section-title" style={{ marginBottom: 0 }}>Live Pickers</h2>
              <button className="gb-refresh-btn" onClick={fetchTrips}>↻ Refresh</button>
            </div>

            {loading ? (
              <div className="gb-empty"><div className="gb-spinner" /><p>Loading pickers…</p></div>
            ) : trips.filter(t => t.picker !== myUsername).length === 0 ? (
              <div className="gb-empty">
                <span className="gb-empty-icon">🚪</span>
                <p>No pickers right now. Be the first!</p>
              </div>
            ) : (
              <div className="gb-trip-list">
                {trips.filter(t => t.picker !== myUsername).map((trip) => {
                  const myBookings = trip.bookings?.filter((b) => b.booker === myUsername) || [];
                  const latestBooking = myBookings.length > 0 ? myBookings[myBookings.length - 1] : null;

                  return (
                    <div key={trip._id} className="gb-trip-card glass-card">
                      <div className="gb-trip-left">
                        <div className="gb-trip-avatar">{(trip.pickerName || trip.picker)[0].toUpperCase()}</div>
                        <div className="gb-trip-info">
                          <span className="gb-trip-name">{trip.pickerName || trip.picker}</span>
                          <span className="gb-trip-time">Room {trip.pickerRoom} · {timeAgo(trip.createdAt)}</span>
                          {trip.note && <span className="gb-trip-note">"{trip.note}"</span>}
                        </div>
                      </div>
                      <div className="gb-trip-right">
                        <div className="gb-trip-stats">
                          <span className="gb-trip-price">₹{trip.price}</span>
                          <span className="gb-trip-slots">{trip.slotsLeft} / {trip.slots} slots</span>
                        </div>
                        {latestBooking?.status === "APPROVED" ? (
                          <button className="gb-booked-btn" style={{ background: "#10b981", color: "white" }} disabled>✅ Accepted</button>
                        ) : latestBooking?.status === "PENDING" ? (
                          <button className="gb-booked-btn" disabled>🟡 Pending</button>
                        ) : trip.slotsLeft > 0 ? (
                          <button className="gb-book-btn-live" onClick={() => setShowBookModal(trip)}>Book</button>
                        ) : (
                          <button className="gb-full-btn" disabled>Full</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── MY TRIP TAB ── */}
        {activeTab === "myTrip" && myActiveTrip && (
          <section className="gb-feed-section">
            <h2 className="gb-section-title">Your Active Trip</h2>
            <div className="gb-trip-card glass-card my-trip" style={{ flexDirection: "column", alignItems: "stretch", gap: "1.2rem" }}>
              <div className="gb-trip-left">
                <div className="gb-trip-avatar">{(myActiveTrip.pickerName || myActiveTrip.picker)[0].toUpperCase()}</div>
                <div className="gb-trip-info">
                  <span className="gb-trip-name">{myActiveTrip.pickerName || myActiveTrip.picker}</span>
                  <span className="gb-trip-time">Room {myActiveTrip.pickerRoom} · {timeAgo(myActiveTrip.createdAt)}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "0.5rem", position: "relative", zIndex: 1 }}>
                <div className="gb-trip-stats" style={{ flexDirection: "row", alignItems: "center", gap: "1rem" }}>
                  <span className="gb-trip-price">₹{myActiveTrip.price}</span>
                  <span className="gb-trip-slots">{myActiveTrip.slotsLeft} / {myActiveTrip.slots} slots</span>
                </div>
                <button className="gb-cancel-btn" onClick={(e) => handleCancelTrip(myActiveTrip._id, e)}>Cancel Trip</button>
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <p style={{ textAlign: "center", color: "#64748b" }}>Manage incoming pickup requests in the <strong>My Requests</strong> tab.</p>
            </div>
          </section>
        )}

        {/* ── REQUESTS TAB (Merged from GateRequests.jsx) ── */}
        {activeTab === "requests" && (
          <section className="gr-content" style={{ padding: 0 }}>
            <div className="gr-tabs" style={{ marginBottom: "1rem" }}>
              <button className={`gr-tab ${reqTab === "incoming" ? "active" : ""}`} onClick={() => setReqTab("incoming")}>
                📥 Incoming (You are picker)
                {pendingCount > 0 && <span className="gr-tab-badge">{pendingCount}</span>}
              </button>
              <button className={`gr-tab ${reqTab === "outgoing" ? "active" : ""}`} onClick={() => setReqTab("outgoing")}>
                📤 Outgoing (You are booker)
              </button>
              <button className="gr-refresh" onClick={fetchRequests}>↻</button>
            </div>

            {loading ? (
              <div className="gr-empty"><div className="gr-spinner" /><p>Loading requests…</p></div>
            ) : activeReqList.length === 0 ? (
              <div className="gr-empty" style={{ minHeight: "300px" }}>
                <span className="gr-empty-icon">{reqTab === "incoming" ? "📥" : "📤"}</span>
                <h3>{reqTab === "incoming" ? "No incoming requests" : "No outgoing requests"}</h3>
                <p>{reqTab === "incoming" ? "Wait for hostelmates to book your trip." : "Browse the live feed to book a picker."}</p>
              </div>
            ) : (
              <div className="gr-list">
                {activeReqList.map((req) => {
                  const sc = statusConfig[req.status] || statusConfig.PENDING;
                  const isActing = actionLoading === req.bookingId;
                  const canChat = req.status === "APPROVED" || req.status === "ARRIVED";
                  const showUpi = reqTab === "outgoing" && req.status === "ARRIVED" && req.pickerUpiId;
                  return (
                    <div key={req.bookingId} className={`gr-card glass-card ${req.status === "PENDING" ? "gr-card-pending" : ""}`}>
                      <div className="gr-card-top">
                        <div className="gr-avatar">
                          {(reqTab === "incoming" ? (req.bookerName || req.booker || "?") : (req.pickerName || req.picker || "?"))[0].toUpperCase()}
                        </div>
                        <div className="gr-card-info">
                          <span className="gr-card-name">{reqTab === "incoming" ? (req.bookerName || req.booker) : (req.pickerName || req.picker)}</span>
                          <span className="gr-card-meta">
                            {reqTab === "incoming" ? `Room ${req.bookerRoom || "?"} · ₹${req.price}` : `Room ${req.pickerRoom} · ₹${req.price}`}
                          </span>
                          <span className="gr-card-time">{timeAgo(req.bookedAt)}</span>
                        </div>
                        <div className={`gr-status ${sc.cls}`}><span>{sc.icon}</span> {sc.label}</div>
                      </div>

                      {req.orderDetails && (
                        <div className="gr-order">
                          <span className="gr-order-label">Order:</span>
                          <span className="gr-order-text">{req.orderDetails} {req.orderPrice !== undefined && `(₹${req.orderPrice})`}</span>
                        </div>
                      )}

                      {/* Picker Actions */}
                      {reqTab === "incoming" && req.status === "PENDING" && (
                        <div className="gr-actions">
                          <button className="gr-approve" onClick={() => handleApprove(req.tripId, req.bookingId)} disabled={isActing}>✅ Approve</button>
                          <button className="gr-reject" onClick={() => handleReject(req.tripId, req.bookingId)} disabled={isActing}>❌ Reject</button>
                        </div>
                      )}

                      {reqTab === "incoming" && req.status === "APPROVED" && (
                        <div className="gr-actions">
                          <button className="gr-chat-btn" onClick={() => openChat(req)}>💬 Chat</button>
                          <button className="gr-arrive" onClick={() => handleArrive(req.tripId, req.bookingId)} disabled={isActing} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontWeight: "600", cursor: "pointer" }}>
                            🏠 Mark Arrived
                          </button>
                        </div>
                      )}

                      {/* Booker Actions */}
                      {reqTab === "outgoing" && canChat && (
                        <div className="gr-actions">
                          <button className="gr-chat-btn" onClick={() => openChat(req)}>💬 Chat</button>
                          {showUpi && <button className="gr-upi-btn" onClick={() => openUpiModal(req)}>💸 Pay UPI</button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── MODALS ── */}
      {/* Post Modal */}
      {showPostModal && (
        <div className="gb-modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="gb-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="gb-modal-title">🧑‍🎒 I'm Going to Gate</h2>
            <form onSubmit={handlePostTrip} className="gb-form">
              <div className="gb-form-group">
                <label>Your Name</label>
                <input type="text" placeholder="e.g. Rahul Kumar" value={postForm.pickerName} onChange={(e) => setPostForm({ ...postForm, pickerName: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Your Room Number</label>
                <input type="text" placeholder="e.g. A-204" value={postForm.pickerRoom} onChange={(e) => setPostForm({ ...postForm, pickerRoom: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Your Price (₹)</label>
                <input type="number" min="1" placeholder="e.g. 30" value={postForm.price} onChange={(e) => setPostForm({ ...postForm, price: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Available Slots</label>
                <div className="gb-slot-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className={`gb-slot-btn ${postForm.slots === n ? "active" : ""}`} onClick={() => setPostForm({ ...postForm, slots: n })}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="gb-form-group">
                <label>Note (optional)</label>
                <input type="text" maxLength={200} placeholder='e.g. "Leaving in 10 mins"' value={postForm.note} onChange={(e) => setPostForm({ ...postForm, note: e.target.value })} />
              </div>
              <div className="gb-form-group">
                <label>Your UPI ID</label>
                <input type="text" placeholder="e.g. name@upi" value={postForm.upiId} onChange={(e) => setPostForm({ ...postForm, upiId: e.target.value })} required />
              </div>
              <div className="gb-form-actions">
                <button type="button" className="gb-btn-ghost" onClick={() => setShowPostModal(false)}>Cancel</button>
                <button type="submit" className="gb-btn-primary" disabled={submitting}>{submitting ? "Posting…" : "🚀 Go Live"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {showBookModal && (
        <div className="gb-modal-overlay" onClick={() => setShowBookModal(null)}>
          <div className="gb-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="gb-modal-title">📦 Book {showBookModal.pickerName || showBookModal.picker}</h2>
            <form onSubmit={handleBookTrip} className="gb-form">
              <div className="gb-form-group">
                <label>Your Name</label>
                <input type="text" placeholder="e.g. Rahul Kumar" value={bookForm.bookerName} onChange={(e) => setBookForm({ ...bookForm, bookerName: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Your Room</label>
                <input type="text" placeholder="e.g. B-105" value={bookForm.bookerRoom} onChange={(e) => setBookForm({ ...bookForm, bookerRoom: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Order Price (₹)</label>
                <input type="number" min="0" placeholder="e.g. 250" value={bookForm.orderPrice} onChange={(e) => setBookForm({ ...bookForm, orderPrice: e.target.value })} required />
              </div>
              <div className="gb-form-group">
                <label>Order Details</label>
                <input type="text" placeholder='e.g. "Zomato, name: Rahul"' value={bookForm.orderDetails} onChange={(e) => setBookForm({ ...bookForm, orderDetails: e.target.value })} required />
              </div>
              <div className="gb-form-actions">
                <button type="button" className="gb-btn-ghost" onClick={() => setShowBookModal(null)}>Cancel</button>
                <button type="submit" className="gb-btn-primary" disabled={submitting}>{submitting ? "Sending…" : "📋 Send Request"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatOpen && (
        <div className="gr-chat-overlay" onClick={() => setChatOpen(null)}>
          <div className="gr-chat-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="gr-chat-header">
              <div className="gr-chat-header-info">
                <div className="gr-chat-avatar">
                  {(chatOpen.role === "picker" ? (chatOpen.bookerName || chatOpen.booker) : (chatOpen.pickerName || chatOpen.picker))[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="gr-chat-name">
                    {chatOpen.role === "picker" ? (chatOpen.bookerName || chatOpen.booker) : (chatOpen.pickerName || chatOpen.picker)}
                  </h4>
                  <span className="gr-chat-subtitle">Gate Buddy Trip · ₹{chatOpen.price}</span>
                </div>
              </div>
              <button className="gr-chat-close" onClick={() => setChatOpen(null)}>✕</button>
            </div>
            <div className="gr-chat-messages">
              {chatLoading ? <div className="gr-chat-empty">Loading messages…</div> : chatMessages.length === 0 ? <div className="gr-chat-empty"><span>👋</span><p>Start chatting!</p></div> : (
                chatMessages.map((msg) => (
                  <div key={msg._id} className={`gr-chat-bubble ${msg.sender === myUsername ? "sent" : "received"}`}>
                    <p className="gr-chat-bubble-text">{msg.message}</p>
                    <span className="gr-chat-bubble-time">{formatTime(msg.createdAt)}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="gr-chat-input-bar" onSubmit={handleChatSend}>
              <input ref={chatInputRef} type="text" className="gr-chat-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message…" />
              <button type="submit" className="gr-chat-send-btn" disabled={!chatInput.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}

      {/* UPI Modal */}
      {upiModal && (
        <div className="gr-chat-overlay" onClick={() => setUpiModal(null)}>
          <div className="gr-upi-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="gr-chat-close" onClick={() => setUpiModal(null)} style={{ position: "absolute", right: "16px", top: "16px" }}>✕</button>
            <div className="gr-upi-header">
              <span className="gr-upi-icon">💸</span>
              <h3>Pay {upiModal.pickerName || upiModal.picker}</h3>
            </div>
            <div className="gr-upi-breakdown">
              <div className="gr-upi-row"><span>Order Price</span><span>₹{upiModal.orderPrice || 0}</span></div>
              <div className="gr-upi-row"><span>Picker Fee</span><span>₹{upiModal.price}</span></div>
              <div className="gr-upi-row gr-upi-total"><span>Total</span><span>₹{(Number(upiModal.orderPrice) || 0) + Number(upiModal.price)}</span></div>
            </div>
            {qrDataUrl ? (
              <div className="gr-upi-qr"><img src={qrDataUrl} alt="UPI QR Code" /></div>
            ) : (
              <div className="gr-upi-qr"><div className="gb-spinner" /><p>Generating QR…</p></div>
            )}
            <div className="gr-upi-id"><span>UPI ID:</span><strong>{upiModal.pickerUpiId}</strong></div>
            <a href={`upi://pay?pa=${encodeURIComponent(upiModal.pickerUpiId)}&pn=${encodeURIComponent(upiModal.pickerName || upiModal.picker)}&am=${(Number(upiModal.orderPrice) || 0) + Number(upiModal.price)}&cu=INR&tn=${encodeURIComponent(`Gate Buddy`)}`} className="gr-upi-pay-btn">📱 Open in UPI App</a>
          </div>
        </div>
      )}

      {/* ── Guidelines Modal ── */}
      {showGuidelines && (
        <div className="gb-modal-overlay" onClick={() => setShowGuidelines(false)}>
          <div className="gb-modal glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h2 className="gb-modal-title" style={{ marginBottom: 0 }}>📖 How Gate Buddy Works</h2>
              <button onClick={() => setShowGuidelines(false)} style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Picker Guide */}
              <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "14px", padding: "1.2rem" }}>
                <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1.05rem", color: "#818cf8" }}>🚶 For Pickers (Going to Gate)</h3>
                <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: "1.7", color: "#94a3b8" }}>
                  <li>Click <strong>"I'm Going to Gate"</strong> and fill your details.</li>
                  <li>Set your <strong>price</strong> and how many orders you can carry.</li>
                  <li>Wait for hostelmates to send you booking requests.</li>
                  <li>Go to <strong>"My Requests"</strong> → <strong>Incoming</strong> to accept or reject.</li>
                  <li>Once you're back with the order, click <strong>"Mark Arrived"</strong>.</li>
                  <li>The booker will come to your room to collect their order and pay.</li>
                </ol>
              </div>

              {/* Booker Guide */}
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "14px", padding: "1.2rem" }}>
                <h3 style={{ margin: "0 0 0.8rem 0", fontSize: "1.05rem", color: "#34d399" }}>📦 For Bookers (Need Something from Gate)</h3>
                <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", lineHeight: "1.7", color: "#94a3b8" }}>
                  <li>Browse <strong>"Live Feed"</strong> and find a picker going to the gate.</li>
                  <li>Click <strong>"Book"</strong> and enter your order details and price.</li>
                  <li>Wait for the picker to accept your request.</li>
                  <li>Once accepted, use <strong>Chat</strong> to coordinate with the picker.</li>
                  <li>When the picker clicks "Arrived", go to their room to collect your order.</li>
                  <li>Pay the picker (order price + picker fee) via <strong>UPI</strong> or cash.</li>
                </ol>
              </div>

              {/* Tips */}
              <div style={{ background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: "14px", padding: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#fbbf24" }}>💡 Tips</h3>
                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", lineHeight: "1.7", color: "#94a3b8" }}>
                  <li>Only post genuine trips — don't spam.</li>
                  <li>Keep your UPI ID updated in your profile for easy payments.</li>
                  <li>Use chat to share order screenshots or special instructions.</li>
                  <li>Be respectful and on time!</li>
                </ul>
              </div>
            </div>

            <button onClick={() => setShowGuidelines(false)} className="gb-btn-primary" style={{ width: "100%", marginTop: "1.5rem", justifyContent: "center" }}>
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateBuddy;
