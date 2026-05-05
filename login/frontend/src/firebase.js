// Firebase client configuration for Hostel Buddy
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA68IL9NeT7Id-WRQOjdzw9DyVOG0Ubkio",
  authDomain: "hostel-buddy-4c1e2.firebaseapp.com",
  projectId: "hostel-buddy-4c1e2",
  storageBucket: "hostel-buddy-4c1e2.firebasestorage.app",
  messagingSenderId: "582119416015",
  appId: "1:582119416015:web:7384edb398b3187bbf97ba",
  measurementId: "G-3SGHE9SDYG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("Firebase Messaging not supported in this browser:", error);
}

export { messaging, getToken, onMessage };
export default app;
