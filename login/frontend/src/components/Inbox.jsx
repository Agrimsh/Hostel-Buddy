import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Inbox.css';
import './Dashboard.css';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Inbox = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const user = JSON.parse(localStorage.getItem("user") || '{"email": "Student"}');
  const currentUser = user.email ? user.email.split('@')[0] : "Student";

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  // Scroll to bottom of messages
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
      // Update active conversation messages
      if (
        activeConv &&
        msg.itemId === activeConv.itemId &&
        ((msg.sender === currentUser && msg.receiver === activeConv.otherUser) ||
         (msg.sender === activeConv.otherUser && msg.receiver === currentUser))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversation list preview
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => c.itemId === msg.itemId && c.otherUser === (msg.sender === currentUser ? msg.receiver : msg.sender)
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: msg.message,
            lastTimestamp: msg.createdAt,
          };
          // Move to top
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
          return updated;
        } else {
          // New conversation appeared
          return [
            {
              otherUser: msg.sender === currentUser ? msg.receiver : msg.sender,
              itemId: msg.itemId,
              itemTitle: msg.itemTitle,
              lastMessage: msg.message,
              lastTimestamp: msg.createdAt,
            },
            ...prev,
          ];
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, activeConv]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_URL}/chat/conversations?user=${currentUser}`);
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [API_URL, currentUser]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    const fetchMessages = async () => {
      setMsgLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/chat/history?sender=${currentUser}&receiver=${activeConv.otherUser}&itemId=${activeConv.itemId}`
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
  }, [activeConv, API_URL, currentUser]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current || !activeConv) return;

    socketRef.current.emit('sendMessage', {
      sender: currentUser,
      receiver: activeConv.otherUser,
      message: text,
      itemId: activeConv.itemId,
      itemTitle: activeConv.itemTitle,
    });
    setInput('');
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isActive = (conv) => {
    return activeConv && activeConv.itemId === conv.itemId && activeConv.otherUser === conv.otherUser;
  };

  // Mobile: show conversation list or chat, not both
  const [mobileView, setMobileView] = useState('list');

  const selectConversation = (conv) => {
    setActiveConv(conv);
    setMobileView('chat');
  };

  const backToList = () => {
    setMobileView('list');
  };

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <div className="inbox-page">
        {/* Header */}
        <header className="dashboard-header glass">
          <div className="header-left header-brand">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <span>&larr;</span>
            </button>
            <h2>Inbox</h2>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Main area */}
        <div className="inbox-container">
          {/* Sidebar — conversation list */}
          <aside className={`inbox-sidebar ${mobileView === 'list' ? 'mobile-show' : 'mobile-hide'}`}>
            <div className="inbox-sidebar-header">
              <h3>Messages</h3>
              <span className="inbox-count">{conversations.length}</span>
            </div>

            {loading ? (
              <div className="inbox-loading">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="inbox-empty-sidebar">
                <span>📭</span>
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="inbox-list">
                {conversations.map((conv, i) => (
                  <div
                    key={`${conv.itemId}-${conv.otherUser}-${i}`}
                    className={`inbox-conv-item ${isActive(conv) ? 'active' : ''}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="inbox-conv-avatar">
                      {conv.otherUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="inbox-conv-info">
                      <div className="inbox-conv-top">
                        <span className="inbox-conv-name">{conv.otherUser}</span>
                        <span className="inbox-conv-time">{formatTime(conv.lastTimestamp)}</span>
                      </div>
                      <p className="inbox-conv-item-title">{conv.itemTitle || 'Item'}</p>
                      <p className="inbox-conv-preview">{conv.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Chat panel */}
          <section className={`inbox-chat ${mobileView === 'chat' ? 'mobile-show' : 'mobile-hide'}`}>
            {!activeConv ? (
              <div className="inbox-no-selection">
                <div className="inbox-no-selection-inner">
                  <span className="inbox-no-icon">💬</span>
                  <h3>Select a conversation</h3>
                  <p>Choose from the sidebar to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="inbox-chat-header">
                  <button className="inbox-back-mobile" onClick={backToList}>
                    ←
                  </button>
                  <div className="inbox-chat-avatar">
                    {activeConv.otherUser.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="inbox-chat-name">{activeConv.otherUser}</h4>
                    <p className="inbox-chat-item-label">{activeConv.itemTitle || 'Item'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="inbox-messages">
                  {msgLoading ? (
                    <div className="inbox-msg-loading">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="inbox-msg-empty">
                      <span>👋</span>
                      <p>Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`inbox-bubble ${msg.sender === currentUser ? 'sent' : 'received'}`}
                      >
                        <p className="inbox-bubble-text">{msg.message}</p>
                        <span className="inbox-bubble-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form className="inbox-input-bar" onSubmit={handleSend}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="inbox-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                  />
                  <button
                    type="submit"
                    className="inbox-send-btn"
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
