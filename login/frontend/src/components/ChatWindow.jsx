import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatWindow.css';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ChatWindow = ({ item, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const seller = item.seller;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket + fetch history
  useEffect(() => {
    // 1. Create socket connection
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRoom', currentUser);
    });

    // 2. Listen for incoming messages
    socket.on('receiveMessage', (msg) => {
      // Only show messages relevant to this conversation
      if (
        msg.itemId === item._id &&
        ((msg.sender === currentUser && msg.receiver === seller) ||
         (msg.sender === seller && msg.receiver === currentUser))
      ) {
        setMessages((prev) => {
          // Avoid duplicates by checking _id
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    // 3. Fetch chat history
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${API_URL}/chat/history?sender=${currentUser}&receiver=${seller}&itemId=${item._id}`
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Focus input
    setTimeout(() => inputRef.current?.focus(), 300);

    return () => {
      socket.disconnect();
    };
  }, [item._id, currentUser, seller, API_URL]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current) return;

    const msgData = {
      sender: currentUser,
      receiver: seller,
      message: text,
      itemId: item._id,
      itemTitle: item.title,
    };

    socketRef.current.emit('sendMessage', msgData);
    setInput('');
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              {seller.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="chat-recipient-name">{seller}</h3>
              <p className="chat-item-label">{item.title} · ₹{item.price}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">
              <div className="chat-loading-dot"></div>
              <div className="chat-loading-dot"></div>
              <div className="chat-loading-dot"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <span className="chat-empty-icon">💬</span>
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat-bubble ${msg.sender === currentUser ? 'sent' : 'received'}`}
              >
                <p className="chat-bubble-text">{msg.message}</p>
                <span className="chat-bubble-time">{formatTime(msg.createdAt)}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-bar" onSubmit={handleSend}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
