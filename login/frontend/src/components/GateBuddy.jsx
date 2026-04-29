import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import "./GateBuddy.css";

// VITE_API_URL already includes /api (e.g. http://localhost:5000/api)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

const GateBuddy = () => {
  const navigate = useNavigate();
  const [isDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myUsername = user.email ? user.email.split("@")[0] : "";
  const token = localStorage.getItem("token");

  // ── State ──────────────────────────────────────────────────
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(null); // holds trip being booked
  const [postForm, setPostForm] = useState({ price: "", slots: 1, note: "", pickerName: "", pickerRoom: "" });
  const [bookForm, setBookForm] = useState({ orderDetails: "", bookerName: "", bookerRoom: "", orderPrice: "" });
  const [submitting, setSubmitting] = useState(false);
  const [socket, setSocket] = useState(null);

  const [activeTab, setActiveTab] = useState("live"); // "live" | "myTrip"

  // ── Socket setup ───────────────────────────────────────────
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("newGateTrip", (trip) => {
      setTrips((prev) => [trip, ...prev]);
      if (trip.picker !== myUsername) {
        toast.info(`🚪 ${trip.pickerName || trip.picker} is going to gate for ₹${trip.price}!`);
      }
    });

    s.on("gateTripUpdated", (updated) => {
      setTrips((prev) =>
        updated.status === "active"
          ? prev.map((t) => (t._id === updated._id ? updated : t))
          : prev.filter((t) => t._id !== updated._id)
      );
    });

    s.on("gateTripRemoved", (tripId) => {
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
    });

    return () => s.disconnect();
  }, [myUsername]);

  // ── Fetch active trips ─────────────────────────────────────
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

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Post a trip ────────────────────────────────────────────
  const handlePostTrip = async (e) => {
    e.preventDefault();
    if (!postForm.price || postForm.price <= 0) {
      return toast.error("Enter a valid price");
    }
    setSubmitting(true);
    try {
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
        setPostForm({ price: "", slots: 1, note: "", pickerName: "", pickerRoom: "" });
        setActiveTab("myTrip"); // switch to my trip after posting
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Book a trip (creates PENDING request) ──────────────────
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
        toast.success(`📋 Request sent to ${showBookModal.pickerName || showBookModal.picker}! Check Gate Requests for updates.`);
        setShowBookModal(null);
        setBookForm({ orderDetails: "", bookerName: "", bookerRoom: "", orderPrice: "" });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel my trip ─────────────────────────────────────────
  const handleCancelTrip = async (tripId) => {
    try {
      const res = await fetch(`${API_URL}/gate/trips/${tripId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Update local state immediately
        setTrips((prev) => prev.filter((t) => t._id !== tripId));
        socket?.emit("gateTripCancelled", tripId);
        toast.success("Trip cancelled successfully");
        setActiveTab("live"); // go back to live feed if cancelled
      } else {
        toast.error(data.message || "Failed to cancel trip");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const myActiveTrip = trips.find((t) => t.picker === myUsername);
  const myActiveBooking = trips.some((t) =>
    t.bookings?.some((b) => b.booker === myUsername && (b.status === "PENDING" || b.status === "APPROVED"))
  );

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={`gatebuddy-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <div className="gb-blob gb-blob-1" />
      <div className="gb-blob gb-blob-2" />
      <div className="gb-blob gb-blob-3" />

      {/* Header */}
      <header className="gb-header glass">
        <button className="gb-back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <div className="gb-header-brand">
          <span className="gb-brand-icon">🚪</span>
          <span className="gb-brand-name">Gate Buddy</span>
        </div>
        <div style={{ width: "80px" }} />
      </header>

      <main className="gb-main">

        {/* Hero */}
        <div className="gb-hero">
          <div className="gb-badge">
            <span className="gb-badge-dot" />
            {trips.length > 0 ? `${trips.length} picker${trips.length > 1 ? "s" : ""} live now` : "No pickers right now"}
          </div>

          <h1 className="gb-hero-title">
            Going to the Gate?<br />
            <span className="gb-gradient-text">Post & Get Booked</span>
          </h1>

          <p className="gb-hero-subtitle">
            Heading to the gate anyway? Post your trip, set your price, and earn.
            Or book a hostler already going — your order, delivered to your room.
          </p>

          <div className="gb-cta-group">
            <button
              className={`gb-btn-primary ${activeTab === "myTrip" ? "active" : ""}`}
              onClick={() => {
                if (myActiveTrip) {
                  setActiveTab("myTrip");
                } else {
                  setShowPostModal(true);
                }
              }}
            >
              {myActiveTrip ? "View My Trip" : "I'm Going to Gate"}
            </button>
            <button
              className={`gb-btn-secondary ${activeTab === "live" ? "active" : ""}`}
              onClick={() => setActiveTab("live")}
            >
              <span>📦</span> Book a Picker
            </button>
          </div>
        </div>

        {/* ── My Trip Section ── */}
        {activeTab === "myTrip" && myActiveTrip && (
          <section className="gb-feed-section" id="gb-mytrip" style={{ marginBottom: "2rem" }}>
            <div className="gb-feed-header">
              <h2 className="gb-section-title" style={{ marginBottom: 0 }}>
                Your Active Trip
              </h2>
            </div>
            <div className="gb-trip-list">
              <div className="gb-trip-card glass-card my-trip">
                <div className="gb-my-badge">Your Trip</div>
                <div className="gb-trip-left">
                  <div className="gb-trip-avatar">{(myActiveTrip.pickerName || myActiveTrip.picker)[0].toUpperCase()}</div>
                  <div className="gb-trip-info">
                    <span className="gb-trip-name">{myActiveTrip.pickerName || myActiveTrip.picker}</span>
                    <span className="gb-trip-time">Room {myActiveTrip.pickerRoom} · {timeAgo(myActiveTrip.createdAt)}</span>
                    {myActiveTrip.note && <span className="gb-trip-note">"{myActiveTrip.note}"</span>}
                  </div>
                </div>
                <div className="gb-trip-right">
                  <div className="gb-trip-stats">
                    <span className="gb-trip-price">₹{myActiveTrip.price}</span>
                    <span className="gb-trip-slots">
                      {myActiveTrip.slotsLeft} / {myActiveTrip.slots} slots left
                    </span>
                  </div>
                  <button className="gb-cancel-btn" onClick={() => handleCancelTrip(myActiveTrip._id)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Live Feed ── */}
        {activeTab === "live" && (
          <section className="gb-feed-section" id="gb-feed">
            <div className="gb-feed-header">
              <h2 className="gb-section-title" style={{ marginBottom: 0 }}>
                🔴 Live Picker Feed
              </h2>
              <button className="gb-refresh-btn" onClick={fetchTrips}>↻ Refresh</button>
            </div>

            {loading ? (
              <div className="gb-empty">
                <div className="gb-spinner" />
                <p>Loading trips…</p>
              </div>
            ) : trips.filter(t => t.picker !== myUsername).length === 0 ? (
              <div className="gb-empty">
                <span className="gb-empty-icon">🚪</span>
                <p>No other pickers are going to the gate right now.</p>
                <p className="gb-empty-sub">Be the first to post your trip!</p>
              </div>
            ) : (
              <div className="gb-trip-list">
                {trips.filter(t => t.picker !== myUsername).map((trip) => {
                  // Find the user's most recent booking for this trip
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
                          <span className="gb-trip-slots">
                            {trip.slotsLeft} / {trip.slots} slots left
                          </span>
                        </div>

                        {latestBooking?.status === "APPROVED" ? (
                          <button className="gb-booked-btn" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", borderColor: "transparent" }} disabled>✅ Accepted</button>
                        ) : latestBooking?.status === "PENDING" ? (
                          <button className="gb-booked-btn" disabled>🟡 Pending</button>
                        ) : trip.slotsLeft > 0 ? (
                          <button className="gb-book-btn-live" onClick={() => setShowBookModal(trip)}>
                            Book
                          </button>
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
      </main>

      {/* ── Post Trip Modal ── */}
      {showPostModal && (
        <div className="gb-modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="gb-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="gb-modal-title">🧑‍🎒 I'm Going to Gate</h2>
            <p className="gb-modal-sub">Set your price and let hostelmates book you.</p>

            <form onSubmit={handlePostTrip} className="gb-form">
              <div className="gb-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={postForm.pickerName}
                  onChange={(e) => setPostForm({ ...postForm, pickerName: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Your Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. A-204"
                  value={postForm.pickerRoom}
                  onChange={(e) => setPostForm({ ...postForm, pickerRoom: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Your Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={postForm.price}
                  onChange={(e) => setPostForm({ ...postForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Available Slots (how many orders you can carry)</label>
                <div className="gb-slot-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`gb-slot-btn ${postForm.slots === n ? "active" : ""}`}
                      onClick={() => setPostForm({ ...postForm, slots: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gb-form-group">
                <label>Note (optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder='e.g. "Leaving in 10 mins, near gate 2"'
                  value={postForm.note}
                  onChange={(e) => setPostForm({ ...postForm, note: e.target.value })}
                />
              </div>

              <div className="gb-form-actions">
                <button type="button" className="gb-btn-ghost" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="gb-btn-primary" disabled={submitting}>
                  {submitting ? "Posting…" : "🚀 Go Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Book Trip Modal ── */}
      {showBookModal && (
        <div className="gb-modal-overlay" onClick={() => setShowBookModal(null)}>
          <div className="gb-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="gb-modal-title">📦 Book {showBookModal.pickerName || showBookModal.picker}</h2>
            <p className="gb-modal-sub">
              They'll pick your order for <strong>₹{showBookModal.price}</strong>. Share your order details below.
            </p>

            <form onSubmit={handleBookTrip} className="gb-form">
              <div className="gb-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={bookForm.bookerName}
                  onChange={(e) => setBookForm({ ...bookForm, bookerName: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Your Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. B-105"
                  value={bookForm.bookerRoom}
                  onChange={(e) => setBookForm({ ...bookForm, bookerRoom: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Order Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 250"
                  value={bookForm.orderPrice}
                  onChange={(e) => setBookForm({ ...bookForm, orderPrice: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-group">
                <label>Order Details</label>
                <input
                  type="text"
                  placeholder='e.g. "Zomato bag, name: Rahul" or "Amazon parcel"'
                  value={bookForm.orderDetails}
                  onChange={(e) => setBookForm({ ...bookForm, orderDetails: e.target.value })}
                  required
                />
              </div>

              <div className="gb-form-actions">
                <button type="button" className="gb-btn-ghost" onClick={() => setShowBookModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="gb-btn-primary" disabled={submitting}>
                  {submitting ? "Sending…" : "📋 Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateBuddy;
