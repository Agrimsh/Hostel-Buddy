import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import './MarketPlace.css';
import ChatWindow from './ChatWindow';
import SellerInbox from './SellerInbox';
import './Dashboard.css'; // Import to reuse theme utilities

const MarketPlace = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Items from Database
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    price: '',
    category: 'Books',
    condition: 'New',
    name: '',
    roomNumber: '',
  });
  const [editItem, setEditItem] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [chatItem, setChatItem] = useState(null);
  const [sellerInboxItem, setSellerInboxItem] = useState(null);

  // Loading state for forms
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox state
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const user = JSON.parse(localStorage.getItem("user") || '{"email": "Student"}');
  const sellerName = user.email ? user.email.split('@')[0] : "Student";

  const categories = ['All', 'Books', 'Electronics', 'Appliances', 'Stationery', 'Vehicles', 'Others'];
  const formCategories = ['Books', 'Electronics', 'Appliances', 'Stationery', 'Vehicles', 'Others'];

  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/items`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeFilter === 'All'
    ? items
    : items.filter(item => item.category === activeFilter);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem({ ...editItem, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Compress files to make uploads super fast
      const options = {
        maxSizeMB: 0.5, // 500KB max size
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };

      try {
        const compressedFiles = await Promise.all(
          files.map(async (file) => {
            return await imageCompression(file, options);
          })
        );
        setImageFiles(compressedFiles);
      } catch (error) {
        console.error("Error compressing images:", error);
        setImageFiles(files); // fallback to original if compression fails
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.price) return;

    try {
      const formData = new FormData();
      formData.append("title", newItem.title);
      formData.append("price", newItem.price);
      formData.append("category", newItem.category);
      formData.append("condition", newItem.condition);
      formData.append("seller", sellerName);
      formData.append("name", newItem.name);
      formData.append("roomNumber", newItem.roomNumber);

      imageFiles.forEach(file => formData.append("images", file));

      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setItems([data.data, ...items]);
        setShowAddModal(false);
        setNewItem({ title: '', price: '', category: 'Books', condition: 'New', name: '', roomNumber: '' });
        setImageFiles([]);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editItem.title || !editItem.price) return;

    try {
      const formData = new FormData();
      formData.append("title", editItem.title);
      formData.append("price", editItem.price);
      formData.append("category", editItem.category);
      formData.append("condition", editItem.condition);
      formData.append("name", editItem.name);
      formData.append("roomNumber", editItem.roomNumber);

      imageFiles.forEach(file => formData.append("images", file));

      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/items/${editItem._id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setItems(items.map(i => i._id === editItem._id ? data.data : i));
        setShowEditModal(false);
        setEditItem(null);
        setImageFiles([]);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = async (id) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Returns a resolved URL from a stored path
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600';
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${imagePath}`;
    }
    return imagePath;
  };

  // Normalize old (single `image`) and new (multiple `images`) documents
  const getItemImages = (item) => {
    if (item.images && item.images.length > 0) return item.images.map(getImageUrl);
    if (item.image) return [getImageUrl(item.image)];
    return [getImageUrl(null)];
  };

  // Lightbox helpers
  const openLightbox = (images, index) => setLightbox({ open: true, images, index });
  const closeLightbox = () => setLightbox({ open: false, images: [], index: 0 });
  const lightboxPrev = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const lightboxNext = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox.open) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') lightboxNext();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox.open]);

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? "dark" : "light"}`}>
      <div className="marketplace-page">
        <header className="dashboard-header glass">
          <div className="header-left header-brand">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <span>&larr;</span>
            </button>
            <h2>Marketplace</h2>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button className="add-item-btn" onClick={() => setShowAddModal(true)}>
              + List Item
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="welcome-section">
            <h1 className="gradient-text">Student Marketplace</h1>
            <p className="dashboard-subtitle">Buy and sell items within your Hostel Campus safely.</p>
          </div>

          <div className="filters-bar">
            {categories.map(cat => (
              <span
                key={cat}
                className={`filter-pill ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="empty-state glass-card">
              <p>Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state glass-card">
              <div className="empty-icon">📦</div>
              <h3>No items listed yet</h3>
              <p>Be the first to list an item on the campus marketplace!</p>
              <button className="add-item-btn" onClick={() => setShowAddModal(true)}>
                List an Item
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state glass-card">
              <h3>No {activeFilter} items found</h3>
              <p>Try selecting a different category.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredItems.map(item => {
                const imgs = getItemImages(item);
                return (
                  <div key={item._id} className="product-card glass-card">
                    {/* Hero image */}
                    <div className="product-image-wrap">
                      <img
                        src={imgs[0]}
                        alt={item.title}
                        className="product-image"
                        onClick={() => openLightbox(imgs, 0)}
                        style={{ cursor: 'pointer' }}
                      />
                      {imgs.length > 1 && (
                        <div className="product-thumbs">
                          {imgs.map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt={`Photo ${i + 1}`}
                              className={`product-thumb ${i === 0 ? 'active-thumb' : ''}`}
                              onClick={() => openLightbox(imgs, i)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="product-info">
                      <div className="product-header">
                        <h3 className="product-title">{item.title}</h3>
                        <span className="product-price">₹{item.price}</span>
                      </div>
                      <div className="product-category">{item.category}</div>

                      <div className="product-meta">
                        <div className="seller-info">
                          <div className="seller-avatar">
                            {(item.name || item.seller).charAt(0).toUpperCase()}
                          </div>
                          <span className="seller-name">
                            {item.name || item.seller} {item.roomNumber && item.roomNumber !== "N/A" ? `(Room: ${item.roomNumber})` : ''}
                          </span>
                        </div>
                        <span className="product-condition">{item.condition}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {item.seller === sellerName ? (
                        <>
                          <button className="chat-btn" onClick={() => setSellerInboxItem(item)}>
                            📨 Messages
                          </button>
                          <button className="edit-btn" onClick={() => handleEditClick(item)}>
                            ✏️ Edit
                          </button>
                          <button className="remove-btn" onClick={() => handleRemoveItem(item._id)}>
                            🗑️ Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="chat-btn" onClick={() => setChatItem(item)}>
                            💬 Chat
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Mobile FAB */}
        <button className="fab-mobile" onClick={() => setShowAddModal(true)}>
          +
        </button>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content dark-mode-aware" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>List a New Item</h2>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleAddItem} className="add-item-form">
                <div className="form-group">
                  <label>Item Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newItem.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Engineering Mathematics Textbook"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={newItem.roomNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. A-102"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={newItem.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={newItem.category} onChange={handleInputChange}>
                      {formCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Condition</label>
                  <select name="condition" value={newItem.condition} onChange={handleInputChange}>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Upload Photos (Optional, up to 5)</label>
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  {imageFiles.length > 0 && (
                    <div className="img-preview-strip">
                      {imageFiles.map((f, i) => (
                        <img key={i} src={URL.createObjectURL(f)} alt={`preview-${i}`} className="img-preview-thumb" />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Posting...' : 'Post Item'}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Edit Item Modal */}
        {showEditModal && editItem && (
          <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditItem(null); }}>
            <div className="modal-content dark-mode-aware" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Item</h2>
                <button className="close-btn" onClick={() => { setShowEditModal(false); setEditItem(null); }}>&times;</button>
              </div>

              <form onSubmit={handleUpdateItem} className="add-item-form">
                <div className="form-group">
                  <label>Item Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editItem.title}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Engineering Mathematics Textbook"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editItem.name}
                      onChange={handleEditInputChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={editItem.roomNumber}
                      onChange={handleEditInputChange}
                      placeholder="e.g. A-102"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      value={editItem.price}
                      onChange={handleEditInputChange}
                      placeholder="e.g. 500"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={editItem.category} onChange={handleEditInputChange}>
                      {formCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Condition</label>
                  <select name="condition" value={editItem.condition} onChange={handleEditInputChange}>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Update Photos (Optional, up to 5)</label>
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  {imageFiles.length > 0 ? (
                    <div className="img-preview-strip">
                      {imageFiles.map((f, i) => (
                        <img key={i} src={URL.createObjectURL(f)} alt={`preview-${i}`} className="img-preview-thumb" />
                      ))}
                    </div>
                  ) : (
                    getItemImages(editItem).length > 0 &&
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                      {getItemImages(editItem).length} current photo(s). Upload to replace.
                    </p>
                  )}
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Item'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Chat Window */}
        {chatItem && (
          <ChatWindow
            item={chatItem}
            currentUser={sellerName}
            onClose={() => setChatItem(null)}
          />
        )}

        {/* Seller Inbox for own items */}
        {sellerInboxItem && (
          <SellerInbox
            item={sellerInboxItem}
            currentUser={sellerName}
            onClose={() => setSellerInboxItem(null)}
          />
        )}

        {/* ====== Lightbox ====== */}
        {lightbox.open && (
          <div className="lightbox-overlay" onClick={closeLightbox}>
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            {lightbox.images.length > 1 && (
              <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); lightboxPrev(); }}>‹</button>
            )}
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Photo ${lightbox.index + 1}`}
              className="lightbox-img"
              onClick={e => e.stopPropagation()}
            />
            {lightbox.images.length > 1 && (
              <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); lightboxNext(); }}>›</button>
            )}
            {lightbox.images.length > 1 && (
              <div className="lightbox-dots">
                {lightbox.images.map((_, i) => (
                  <span
                    key={i}
                    className={`lightbox-dot ${i === lightbox.index ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: i })); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPlace;
