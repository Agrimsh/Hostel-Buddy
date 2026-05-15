import { useEffect, useRef } from "react";
import { messaging, getToken, onMessage } from "../firebase";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Your Firebase VAPID key (Web Push certificate key pair)
// Get this from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = "BFU2iXnK0yXv57g7EdB0gEIQhtLMbv9M870LaSX7UlN5dS9a7LpRGZz9EFKcrOqe2tCF9Jya1umYH0GB7M22rX0";

/**
 * useFCM Hook
 * - Requests notification permission after login
 * - Retrieves FCM token and sends it to the backend
 * - Listens for foreground messages and shows toast notifications
 */
const useFCM = () => {
  const hasRegistered = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || hasRegistered.current) return;

    // Don't try on browsers that don't support notifications
    if (!("Notification" in window) || !messaging) {
      console.warn("Push notifications not supported in this browser.");
      return;
    }

    const registerFCM = async () => {
      try {
        if (Notification.permission !== "granted") {
          return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("Service Worker registered:", registration.scope);

        // Get FCM token
        const fcmToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (fcmToken) {
          console.log("FCM Token obtained:", fcmToken.substring(0, 20) + "...");

          // Send token to backend
          const res = await fetch(`${API_URL}/fcm/save-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ token: fcmToken }),
          });

          if (res.ok) {
            console.log("🔔 FCM token saved to server");
            // Store locally so we can remove it on logout
            localStorage.setItem("fcmToken", fcmToken);
          } else {
            console.error("Failed to save FCM token to server");
          }
        }

        hasRegistered.current = true;
      } catch (error) {
        console.error("FCM registration error:", error);
      }
    };

    registerFCM();

    // Listen for foreground messages (when user has the tab open)
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);

        const title = payload.notification?.title || "Hostel Buddy";
        const body = payload.notification?.body || "You have a new notification";
        const type = payload.data?.type || "general";

        // Show a toast notification inside the app
        const toastIcon = getToastIcon(type);
        toast.info(
          <div>
            <strong>{toastIcon} {title}</strong>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", opacity: 0.9 }}>{body}</p>
          </div>,
          {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
          }
        );
      });

      return () => unsubscribe();
    }
  }, []);
};

function getToastIcon(type) {
  switch (type) {
    case "gate_trip_posted": return "🚪";
    case "booking_request": return "📋";
    case "booking_approved": return "✅";
    case "booking_rejected": return "❌";
    case "order_arrived": return "🏠";
    case "trip_cancelled": return "⚠️";
    case "chat": return "💬";
    default: return "🔔";
  }
}

export default useFCM;
