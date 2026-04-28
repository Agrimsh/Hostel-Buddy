import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./GateBuddy.css";

const GateBuddy = () => {
  const navigate = useNavigate();
  const [isDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  return (
    <div className={`gatebuddy-wrapper ${isDarkMode ? "dark" : "light"}`}>
      {/* Ambient background blobs */}
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

      {/* Hero Section */}
      <main className="gb-main">
        <div className="gb-hero">

          {/* Floating badge */}
          <div className="gb-badge">
            <span className="gb-badge-dot" />
            Live Picker Feed
          </div>

          <h1 className="gb-hero-title">
            Going to the Gate?<br />
            <span className="gb-gradient-text">Post & Get Booked</span>
          </h1>

          <p className="gb-hero-subtitle">
            Heading to the gate anyway? Post your trip, set your price, and let
            hostelmates book you to carry their orders back — easy money, zero
            extra effort.
          </p>

          {/* CTA Buttons */}
          <div className="gb-cta-group">
            <button className="gb-btn-primary" disabled>
              <span>🧑‍🎒</span> I'm Going to Gate
            </button>
            <button className="gb-btn-secondary" disabled>
              <span>📦</span> Book a Picker
            </button>
          </div>

          <p className="gb-coming-soon-note">
            🚀 &nbsp;Launching soon — stay tuned!
          </p>
        </div>

        {/* --- Live Feed Preview Card --- */}
        <div className="gb-feed-preview">
          <div className="gb-feed-label">
            <span className="gb-badge-dot" style={{ width: 10, height: 10 }} />
            Live Picker Feed — Preview
          </div>

          {/* Mock picker cards */}
          {[
            { name: "Rahul K.", time: "in 5 mins",  price: 30, slots: 2, avatar: "🧑" },
            { name: "Priya S.", time: "in 12 mins", price: 20, slots: 3, avatar: "👩" },
            { name: "Arjun M.", time: "in 20 mins", price: 25, slots: 1, avatar: "👦" },
          ].map((picker, i) => (
            <div className="gb-picker-card glass-card" key={i}>
              <div className="gb-picker-avatar">{picker.avatar}</div>
              <div className="gb-picker-info">
                <span className="gb-picker-name">{picker.name}</span>
                <span className="gb-picker-meta">
                  🕐 {picker.time} &nbsp;·&nbsp; 🎒 {picker.slots} slot{picker.slots > 1 ? "s" : ""} left
                </span>
              </div>
              <div className="gb-picker-right">
                <span className="gb-picker-price">₹{picker.price}</span>
                <button className="gb-book-btn" disabled>Book</button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="gb-features">
          <div className="gb-feature-card glass-card">
            <div className="gb-feature-icon feat-orange">🧑‍🎒</div>
            <h3>Post Your Trip</h3>
            <p>Going to the gate? Post it live with your price — get booked instantly.</p>
          </div>

          <div className="gb-feature-card glass-card">
            <div className="gb-feature-icon feat-purple">🔔</div>
            <h3>Instant Notifications</h3>
            <p>All hostelmates get notified the moment a picker goes live.</p>
          </div>

          <div className="gb-feature-card glass-card">
            <div className="gb-feature-icon feat-blue">💸</div>
            <h3>You Set the Price</h3>
            <p>Pickers name their own rate — total transparency, no hidden fees.</p>
          </div>

          <div className="gb-feature-card glass-card">
            <div className="gb-feature-icon feat-green">✅</div>
            <h3>One-Tap Booking</h3>
            <p>See a picker you like? Hit Book — they get notified immediately.</p>
          </div>
        </div>

        {/* How It Works */}
        <section className="gb-how">
          <h2 className="gb-section-title">How It Works</h2>

          {/* Two columns: Picker side & Booker side */}
          <div className="gb-two-cols">

            {/* Picker Side */}
            <div className="gb-col glass-card">
              <div className="gb-col-header picker-header">
                <span>🧑‍🎒</span> You're the Picker
              </div>
              <div className="gb-col-steps">
                <div className="gb-mini-step">
                  <div className="gb-mini-num">1</div>
                  <p>Tap <strong>"I'm Going to Gate"</strong> and set your price & available slots.</p>
                </div>
                <div className="gb-mini-step">
                  <div className="gb-mini-num">2</div>
                  <p>Go live — hostelmates get a push notification instantly.</p>
                </div>
                <div className="gb-mini-step">
                  <div className="gb-mini-num">3</div>
                  <p>Accept bookings, collect orders at the gate, deliver & earn 💰</p>
                </div>
              </div>
            </div>

            <div className="gb-col-divider">VS</div>

            {/* Booker Side */}
            <div className="gb-col glass-card">
              <div className="gb-col-header booker-header">
                <span>📦</span> You're Booking
              </div>
              <div className="gb-col-steps">
                <div className="gb-mini-step">
                  <div className="gb-mini-num">1</div>
                  <p>Get notified when a hostler posts they're heading to the gate.</p>
                </div>
                <div className="gb-mini-step">
                  <div className="gb-mini-num">2</div>
                  <p>Tap <strong>"Book"</strong> on any available picker and share order details.</p>
                </div>
                <div className="gb-mini-step">
                  <div className="gb-mini-num">3</div>
                  <p>Sit back — your order arrives at your room door 🚪</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default GateBuddy;
