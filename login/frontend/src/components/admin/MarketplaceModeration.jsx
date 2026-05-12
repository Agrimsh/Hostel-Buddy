import { useState, useEffect, useCallback } from "react";
import { Trash2, AlertTriangle, Loader, Package } from "lucide-react";
import DataTable from "./shared/DataTable";
import Badge from "./shared/Badge";
import { fetchMarketplace, removeItem as apiRemoveItem, markFakeListing } from "../../lib/adminApi";
import { toast } from "react-toastify";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const MarketplaceModeration = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMarketplace();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load marketplace:", err);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await apiRemoveItem(id);
        toast.success("Listing deleted");
        loadItems();
      } catch (err) {
        toast.error(err.message || "Failed to delete listing");
      }
    }
  };

  const handleMarkFake = async (id) => {
    try {
      await markFakeListing(id);
      toast.success("Listing marked as fake/duplicate");
      loadItems();
    } catch (err) {
      toast.error(err.message || "Failed to mark listing");
    }
  };

  const columns = [
    {
      key: "title", 
      header: "Product", 
      accessor: "title",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {row.images && row.images.length > 0 ? (
              <img src={row.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Package size={20} color="#94a3b8" />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 600 }}>{row.title}</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{row.category}</span>
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price", accessor: "price", render: (row) => `₹${row.price}` },
    { key: "seller", header: "Seller", accessor: "seller", render: (row) => row.name || row.seller },
    { key: "status", header: "Status", accessor: "status", render: (row) => {
      if (row.isFake) return <Badge variant="danger">Fake/Duplicate</Badge>;
      return <Badge variant="success">Active</Badge>;
    }},
    { key: "date", header: "Posted", accessor: (row) => new Date(row.createdAt).getTime(), render: (row) => formatDate(row.createdAt) },
    {
      key: "actions", header: "Actions", sortable: false,
      render: (row) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {!row.isFake && (
            <button 
              style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#f59e0b", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              onClick={(e) => { e.stopPropagation(); handleMarkFake(row._id); }}
            >
              <AlertTriangle size={14} /> Mark Fake
            </button>
          )}
          <button 
            style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            onClick={(e) => { e.stopPropagation(); handleRemove(row._id); }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ marginBottom: "1.5rem", color: "#0f172a" }}>Marketplace Moderation</h2>
      
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader size={28} className="spinner" /></div>
      ) : (
        <DataTable columns={columns} data={items} searchPlaceholder="Search listings..." pageSize={10} />
      )}
    </div>
  );
};

export default MarketplaceModeration;
