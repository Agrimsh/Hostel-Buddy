import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./NotificationPrompt.css";

const NotificationPrompt = () => {
  const location = useLocation();
  const [permission, setPermission] = useState(Notification.permission);
  const [dismissed, setDismissed] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || dismissed) return;

    const checkPermission = async () => {
      try {
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
      } catch (error) {
        console.error("Error querying notification permissions:", error);
      }
    };

    checkPermission();
  }, [location.pathname, token, dismissed]);

  const requestPermission = async () => {
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

  if (!token || permission === "granted" || dismissed) {
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

      </div>
    </div>
  );
};

export default NotificationPrompt;
