import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import QRCode from "qrcode";
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

  // ── Chat Modal State ──────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(null); // holds the request object for the active chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatSocketRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // ── UPI Modal State ───────────────────────────────────────────
  const [upiModal, setUpiModal] = useState(null); // holds the request object
  const [qrDataUrl, setQrDataUrl] = useState("");

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

  // ── Arrive ─────────────────────────────────────────────────
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
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to mark as arrived");
    } finally {
      setActionLoading(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // ── CHAT LOGIC ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  const openChat = (req) => {
    setChatOpen(req);
    setChatMessages([]);
    setChatInput("");
    setChatLoading(true);
  };

  // Fetch chat history & connect socket when chat opens
  useEffect(() => {
    if (!chatOpen) return;

    const otherUser = chatOpen.role === "picker" ? chatOpen.booker : chatOpen.picker;
    const tripId = chatOpen.tripId;

    // Fetch chat history
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/chat/history?sender=${myUsername}&receiver=${otherUser}&itemId=${tripId}`
        );
        const data = await res.json();
        if (data.success) setChatMessages(data.data);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setChatLoading(false);
      }
    })();

    // Socket for real-time
    const s = io(SOCKET_URL);
    chatSocketRef.current = s;
    s.emit("joinRoom", myUsername);

    s.on("receiveMessage", (msg) => {
      // Only add messages for this specific trip chat
      if (
        msg.itemId === tripId &&
        ((msg.sender === myUsername && msg.receiver === otherUser) ||
         (msg.sender === otherUser && msg.receiver === myUsername))
      ) {
        setChatMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    setTimeout(() => chatInputRef.current?.focus(), 300);

    return () => {
      s.disconnect();
      chatSocketRef.current = null;
    };
  }, [chatOpen, myUsername]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSend = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !chatSocketRef.current || !chatOpen) return;

    const otherUser = chatOpen.role === "picker" ? chatOpen.booker : chatOpen.picker;

    chatSocketRef.current.emit("sendMessage", {
      sender: myUsername,
      receiver: otherUser,
      message: text,
      itemId: chatOpen.tripId,
      itemTitle: "Gate Buddy Trip",
    });
    setChatInput("");
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // ═══════════════════════════════════════════════════════════════
  // ── UPI QR LOGIC ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  const openUpiModal = async (req) => {
    setUpiModal(req);
    setQrDataUrl("");

    const totalAmount = (Number(req.orderPrice) || 0) + (Number(req.price) || 0);
    const upiId = req.pickerUpiId;

    if (!upiId) {
      toast.error("Picker hasn't set their UPI ID yet.");
      return;
    }

    // Standard UPI deep link format
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(req.pickerName || req.picker)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Gate Buddy - ${req.orderDetails || "Order"}`)}`;

    try {
      const url = await QRCode.toDataURL(upiLink, {
        width: 280,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("QR generation error:", err);
      toast.error("Failed to generate QR code");
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
    PENDING: { label: "Pending", icon: "🟡", cls: "gr-status-pending" },
    APPROVED: { label: "Approved", icon: "🟢", cls: "gr-status-approved" },
    REJECTED: { label: "Rejected", icon: "🔴", cls: "gr-status-rejected" },
    ARRIVED: { label: "Arrived", icon: "🏠", cls: "gr-status-arrived" },
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
                const canChat = req.status === "APPROVED" || req.status === "ARRIVED";
                const showUpi = tab === "outgoing" && req.status === "ARRIVED" && req.pickerUpiId;
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

                    {/* Actions — only for picker on PENDING or APPROVED */}
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

                    {tab === "incoming" && req.status === "APPROVED" && (
                      <div className="gr-actions">
                        <button
                          className="gr-chat-btn"
                          onClick={() => openChat(req)}
                        >
                          💬 Chat
                        </button>
                        <button
                          className="gr-arrive"
                          onClick={() => handleArrive(req.tripId, req.bookingId)}
                          disabled={isActing}
                          style={{
                            flex: 1,
                            padding: "10px",
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            color: "white",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {isActing ? "…" : "🏠 Mark as Arrived"}
                        </button>
                      </div>
                    )}

                    {/* Booker: Chat + UPI for APPROVED / ARRIVED */}
                    {tab === "outgoing" && canChat && (
                      <div className="gr-actions">
                        <button className="gr-chat-btn" onClick={() => openChat(req)}>
                          💬 Chat with {req.pickerName || req.picker}
                        </button>
                        {showUpi && (
                          <button className="gr-upi-btn" onClick={() => openUpiModal(req)}>
                            💸 Pay via UPI
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── CHAT MODAL ──────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {chatOpen && (
        <div className="gr-chat-overlay" onClick={() => setChatOpen(null)}>
          <div className="gr-chat-modal glass-card" onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="gr-chat-header">
              <div className="gr-chat-header-info">
                <div className="gr-chat-avatar">
                  {(chatOpen.role === "picker"
                    ? (chatOpen.bookerName || chatOpen.booker)
                    : (chatOpen.pickerName || chatOpen.picker)
                  )[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="gr-chat-name">
                    {chatOpen.role === "picker"
                      ? (chatOpen.bookerName || chatOpen.booker)
                      : (chatOpen.pickerName || chatOpen.picker)}
                  </h4>
                  <span className="gr-chat-subtitle">Gate Buddy Trip · ₹{chatOpen.price}</span>
                </div>
              </div>
              <button className="gr-chat-close" onClick={() => setChatOpen(null)}>✕</button>
            </div>

            {/* Chat Messages */}
            <div className="gr-chat-messages">
              {chatLoading ? (
                <div className="gr-chat-empty">Loading messages…</div>
              ) : chatMessages.length === 0 ? (
                <div className="gr-chat-empty">
                  <span>👋</span>
                  <p>Start chatting! Coordinate your order pickup.</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`gr-chat-bubble ${msg.sender === myUsername ? "sent" : "received"}`}
                  >
                    <p className="gr-chat-bubble-text">{msg.message}</p>
                    <span className="gr-chat-bubble-time">{formatTime(msg.createdAt)}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form className="gr-chat-input-bar" onSubmit={handleChatSend}>
              <input
                ref={chatInputRef}
                type="text"
                className="gr-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
              />
              <button
                type="submit"
                className="gr-chat-send-btn"
                disabled={!chatInput.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ── UPI PAYMENT MODAL ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {upiModal && (
        <div className="gr-chat-overlay" onClick={() => setUpiModal(null)}>
          <div className="gr-upi-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="gr-chat-close" onClick={() => setUpiModal(null)} style={{ position: "absolute", right: "16px", top: "16px" }}>✕</button>

            <div className="gr-upi-header">
              <span className="gr-upi-icon">💸</span>
              <h3>Pay {upiModal.pickerName || upiModal.picker}</h3>
              <p className="gr-upi-subtitle">Scan the QR code or tap the button to pay</p>
            </div>

            {/* Amount Breakdown */}
            <div className="gr-upi-breakdown">
              <div className="gr-upi-row">
                <span>Order Price</span>
                <span>₹{upiModal.orderPrice || 0}</span>
              </div>
              <div className="gr-upi-row">
                <span>Picker Fee</span>
                <span>₹{upiModal.price}</span>
              </div>
              <div className="gr-upi-row gr-upi-total">
                <span>Total</span>
                <span>₹{(Number(upiModal.orderPrice) || 0) + Number(upiModal.price)}</span>
              </div>
            </div>

            {/* QR Code */}
            {qrDataUrl ? (
              <div className="gr-upi-qr">
                <img src={qrDataUrl} alt="UPI QR Code" />
              </div>
            ) : (
              <div className="gr-upi-qr">
                <div className="gr-spinner" />
                <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Generating QR…</p>
              </div>
            )}

            {/* UPI ID Display */}
            <div className="gr-upi-id">
              <span>UPI ID:</span>
              <strong>{upiModal.pickerUpiId}</strong>
            </div>

            {/* Deep Link Button (works on mobile) */}
            <a
              href={`upi://pay?pa=${encodeURIComponent(upiModal.pickerUpiId)}&pn=${encodeURIComponent(upiModal.pickerName || upiModal.picker)}&am=${(Number(upiModal.orderPrice) || 0) + Number(upiModal.price)}&cu=INR&tn=${encodeURIComponent(`Gate Buddy - ${upiModal.orderDetails || "Order"}`)}`}
              className="gr-upi-pay-btn"
            >
              📱 Open in UPI App
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateRequests;
