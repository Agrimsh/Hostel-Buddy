// Firebase Messaging Service Worker
// Handles background push notifications (when the website tab is closed)

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Must match the config in src/firebase.js
firebase.initializeApp({
  apiKey: "AIzaSyA68IL9NeT7Id-WRQOjdzw9DyVOG0Ubkio",
  authDomain: "hostel-buddy-4c1e2.firebaseapp.com",
  projectId: "hostel-buddy-4c1e2",
  storageBucket: "hostel-buddy-4c1e2.firebasestorage.app",
  messagingSenderId: "582119416015",
  appId: "1:582119416015:web:7384edb398b3187bbf97ba",
  measurementId: "G-3SGHE9SDYG",
});

const messaging = firebase.messaging();

// Handle background messages (when the website is not in the foreground)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  // Since we removed 'notification' from backend payload, we read from 'data'
  const notificationTitle = payload.data?.title || "Hostel Buddy";
  const notificationOptions = {
    body: payload.data?.body || "You have a new notification",
    icon: "/logo.png",
    badge: "/logo.png",
    data: payload.data || {},
    tag: payload.data?.type || "general",
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the app when user clicks the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/";

  switch (data.type) {
    case "gate_trip_posted":
      url = "/gate-buddy";
      break;
    case "booking_request":
    case "booking_approved":
    case "booking_rejected":
    case "trip_cancelled":
    case "order_arrived":
      url = "/gate-buddy";
      break;
    case "chat":
      url = "/inbox";
      break;
    default:
      url = "/dashboard";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
