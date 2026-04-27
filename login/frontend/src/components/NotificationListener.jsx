import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://hostel-buddy-ag0x.onrender.com';

const NotificationListener = () => {
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const currentUser = user.email ? user.email.split('@')[0] : "Student";

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('joinRoom', currentUser);
        });

        socket.on('receiveMessage', (msg) => {
          // If we are not the sender of the message, show a notification
          if (msg.sender !== currentUser) {
            // Only show toast if not currently on inbox (or show it anyway, but this is a simple check)
            // If they are on inbox, they might be talking to this person, so showing a toast might be redundant, 
            // but we'll show it anyway unless they want it fully suppressed.
            toast.info(`New message from ${msg.sender}: ${msg.message}`, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onClick: () => {
                navigate('/inbox');
              }
            });
          }
        });

        return () => {
          socket.disconnect();
        };
      } catch (err) {
        console.error("Error setting up notification socket", err);
      }
    }
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default NotificationListener;
