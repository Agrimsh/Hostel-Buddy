import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./NotificationPrompt.css";

const NotificationPrompt = () => {
  const location = useLocation();
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "default"
  );
  const [dismissed, setDismissed] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || dismissed || !("Notification" in window)) return;

    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permStatus = await navigator.permissions.query({ name: "notifications" });
          permStatus.onchange = () => {
            setPermission(permStatus.state);
          };
          setPermission(permStatus.state);
          
          // Auto-request native prompt if it hasn't been asked yet
          if (permStatus.state === "prompt" || Notification.permission === "default") {
            const newPerm = await Notification.requestPermission();
            setPermission(newPerm);
            if (newPerm === "granted") {
              window.location.reload();
            }
          }
        } else {
          // Fallback for Safari
          setPermission(Notification.permission);
        }
      } catch (error) {
        console.error("Error querying notification permissions:", error);
        setPermission(Notification.permission);
      }
    };

    checkPermission();
  }, [location.pathname, token, dismissed]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      if (newPermission === "granted") {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  if (!token || permission === "granted" || dismissed || !("Notification" in window)) {
    return null;
  }

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt-content">
        <button className="close-btn" onClick={() => setDismissed(true)}>✕</button>
        <div className="prompt-header">
          <div className="icon-pulse">🔔</div>
          <h2>Enable Notifications</h2>
        </div>
        <p>
          Hostel Buddy relies on notifications for important updates like gate buddy and marketplace chats.
          <strong> Please turn on the notification.</strong>
        </p>
        <div className="request-box">
          <button className="btn" style={{ background: "#fbbf24", color: "#1e293b", fontWeight: "bold" }} onClick={requestPermission}>Enable</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
