import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarketPlace.css';
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
  const [newItem, setNewItem] = useState({
    title: '',
    price: '',
    category: 'Books',
    condition: 'New',
  });
  const [imageFile, setImageFile] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const user = JSON.parse(localStorage.getItem("user") || '{"email": "Student"}');
  const sellerName = user.email ? user.email.split('@')[0] : "Student";

  const categories = ['All', 'Books', 'Electronics', 'Appliances', 'Stationery', 'Vehicles'];
  const formCategories = ['Books', 'Electronics', 'Appliances', 'Stationery', 'Vehicles'];

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
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
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch(`${API_URL}/items`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setItems([data.data, ...items]); 
        setShowAddModal(false);
        setNewItem({ title: '', price: '', category: 'Books', condition: 'New' });
        setImageFile(null);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600';
    if (imagePath.startsWith('/uploads')) {
      const baseUrl = API_URL.replace('/api', '');
      return `${baseUrl}${imagePath}`;
    }
    return imagePath;
  };

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
              {filteredItems.map(item => (
                <div key={item._id} className="product-card glass-card">
                  <img src={getImageUrl(item.image)} alt={item.title} className="product-image" />

                  <div className="product-info">
                    <div className="product-header">
                      <h3 className="product-title">{item.title}</h3>
                      <span className="product-price">₹{item.price}</span>
                    </div>
                    <div className="product-category">{item.category}</div>

                    <div className="product-meta">
                      <div className="seller-info">
                        <div className="seller-avatar">
                          {item.seller.charAt(0).toUpperCase()}
                        </div>
                        <span className="seller-name">{item.seller}</span>
                      </div>
                      <span className="product-condition">{item.condition}</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {item.seller === sellerName ? (
                      <button className="remove-btn" onClick={() => handleRemoveItem(item._id)}>
                        🗑️ Remove
                      </button>
                    ) : (
                      <>
                        <button className="chat-btn" onClick={() => alert(`Started chat with ${item.seller}`)}>
                          💬 Chat
                        </button>
                        <button className="buy-btn" onClick={() => alert(`Initiating purchase for ${item.title}`)}>
                          Buy Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
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
                  <label>Upload Image (Optional)</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <button type="submit" className="submit-btn">Post Item</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPlace;
