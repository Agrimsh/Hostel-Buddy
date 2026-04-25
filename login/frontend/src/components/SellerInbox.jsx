import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './SellerInbox.css';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const SellerInbox = ({ item, currentUser, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [activeBuyer, setActiveBuyer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinRoom', currentUser);
    });

    socket.on('receiveMessage', (msg) => {
      // Only care about messages for this item
      if (msg.itemId !== item._id) return;

      // Update active chat if it's the same buyer
      if (
        activeBuyer &&
        ((msg.sender === currentUser && msg.receiver === activeBuyer) ||
         (msg.sender === activeBuyer && msg.receiver === currentUser))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversation list
      setConversations((prev) => {
        const otherUser = msg.sender === currentUser ? msg.receiver : msg.sender;
        const idx = prev.findIndex((c) => c.otherUser === otherUser);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: msg.message,
            lastTimestamp: msg.createdAt,
          };
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
          return updated;
        } else {
          // New buyer appeared
          return [
            {
              otherUser,
              lastMessage: msg.message,
              lastTimestamp: msg.createdAt,
            },
            ...prev,
          ];
        }
      });
    });

    return () => socket.disconnect();
  }, [currentUser, item._id, activeBuyer]);

  // Fetch conversations for this specific item
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          `${API_URL}/chat/conversations?user=${currentUser}&itemId=${item._id}`
        );
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
          // Auto-select first conversation if only one
          if (data.data.length === 1) {
            setActiveBuyer(data.data[0].otherUser);
          }
        }
      } catch (err) {
        console.error('Error fetching item conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [API_URL, currentUser, item._id]);

  // Fetch messages when active buyer changes
  useEffect(() => {
    if (!activeBuyer) return;

    const fetchMessages = async () => {
      setMsgLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/chat/history?sender=${currentUser}&receiver=${activeBuyer}&itemId=${item._id}`
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setMsgLoading(false);
      }
    };
    fetchMessages();
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [activeBuyer, API_URL, currentUser, item._id]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current || !activeBuyer) return;

    socketRef.current.emit('sendMessage', {
      sender: currentUser,
      receiver: activeBuyer,
      message: text,
      itemId: item._id,
      itemTitle: item.title,
    });
    setInput('');
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="seller-inbox-overlay" onClick={onClose}>
      <div className="seller-inbox-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="si-header">
          <div className="si-header-info">
            <h3>📨 Messages for "{item.title}"</h3>
          </div>
          <button className="si-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="si-body">
          {/* Buyer list sidebar */}
          <div className={`si-buyers ${activeBuyer ? 'si-buyers-has-active' : ''}`}>
            {loading ? (
              <div className="si-loading">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="si-empty">
                <span>📭</span>
                <p>No messages yet for this item</p>
              </div>
            ) : (
              conversations.map((conv, i) => (
                <div
                  key={`${conv.otherUser}-${i}`}
                  className={`si-buyer-item ${activeBuyer === conv.otherUser ? 'active' : ''}`}
                  onClick={() => setActiveBuyer(conv.otherUser)}
                >
                  <div className="si-buyer-avatar">
                    {conv.otherUser.charAt(0).toUpperCase()}
                  </div>
                  <div className="si-buyer-info">
                    <div className="si-buyer-top">
                      <span className="si-buyer-name">{conv.otherUser}</span>
                      <span className="si-buyer-time">{formatTime(conv.lastTimestamp)}</span>
                    </div>
                    <p className="si-buyer-preview">{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className={`si-chat ${activeBuyer ? 'si-chat-active' : ''}`}>
            {!activeBuyer ? (
              <div className="si-no-chat">
                <span>💬</span>
                <p>Select a buyer to view messages</p>
              </div>
            ) : (
              <>
                <div className="si-chat-top-bar">
                  <button className="si-back-btn" onClick={() => setActiveBuyer(null)}>←</button>
                  <div className="si-chat-top-avatar">
                    {activeBuyer.charAt(0).toUpperCase()}
                  </div>
                  <h4>{activeBuyer}</h4>
                </div>

                <div className="si-messages">
                  {msgLoading ? (
                    <div className="si-msg-loading">Loading…</div>
                  ) : messages.length === 0 ? (
                    <div className="si-msg-empty">
                      <span>👋</span>
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`si-bubble ${msg.sender === currentUser ? 'sent' : 'received'}`}
                      >
                        <p className="si-bubble-text">{msg.message}</p>
                        <span className="si-bubble-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="si-input-bar" onSubmit={handleSend}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="si-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a reply…"
                  />
                  <button
                    type="submit"
                    className="si-send-btn"
                    disabled={!input.trim()}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInbox;
