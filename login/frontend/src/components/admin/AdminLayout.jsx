import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, ShoppingBag, DoorOpen, LogOut, Menu, X, ChevronLeft, Shield } from "lucide-react";
import "./AdminLayout.css";

const navItems = [
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { path: "/admin/gate-buddy", icon: DoorOpen, label: "Gate Buddy" },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.email ? user.email.split("@")[0] : "Admin";

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const currentPage = navItems.find((item) => item.path === location.pathname) || navItems[0];

  return (
    <div className="admin-wrapper light">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <Shield size={24} className="brand-shield" />
              <div>
                <h2>Hostel Buddy</h2>
                <span className="brand-sub">Moderation</span>
              </div>
            </div>
          )}
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(!collapsed)}>
            <ChevronLeft size={18} className={collapsed ? "rotated" : ""} />
          </button>
          <button className="collapse-btn mobile-only" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : ""}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && <div className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-nav" onClick={handleLogout}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="page-info">
              <h1>{currentPage?.label || "Admin Panel"}</h1>
            </div>
          </div>

          <div className="header-right">
            <button 
              onClick={() => navigate("/dashboard")} 
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
                marginRight: "1rem"
              }}
            >
              Back to App
            </button>
            <div className="admin-avatar">
              <div className="avatar-circle">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
