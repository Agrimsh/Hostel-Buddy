import { useState, useEffect, useCallback } from "react";
import { Trash2, Loader, Ban } from "lucide-react";
import DataTable from "./shared/DataTable";
import Badge from "./shared/Badge";
import { fetchGateTrips, deleteGateRequest, banStudent as apiBan } from "../../lib/adminApi";
import { toast } from "react-toastify";

const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const GateBuddyModeration = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchGateTrips();
      setTrips(data.trips || []);
    } catch (err) {
      console.error("Failed to load trips:", err);
      toast.error("Failed to load gate requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this spam request?")) {
      try {
        await deleteGateRequest(id);
        toast.success("Request deleted");
        loadTrips();
      } catch (err) {
        toast.error(err.message || "Failed to delete request");
      }
    }
  };

  const handleBlockUser = async (userId) => {
    if (window.confirm("Ban this user from the platform?")) {
      try {
        await apiBan(userId);
        toast.success("User banned successfully");
      } catch (err) {
        toast.error(err.message || "Failed to ban user");
      }
    }
  };

  const getStatusVariant = (s) => {
    if (s === "active") return "success";
    if (s === "completed") return "info";
    return "default";
  };

  const columns = [
    {
      key: "user", 
      header: "User", 
      accessor: "pickerName",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>{row.pickerName}</span>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Room {row.pickerRoom}</span>
        </div>
      ),
    },
    { 
      key: "type", 
      header: "Request Details", 
      accessor: "note",
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "300px" }}>
          <span style={{ fontWeight: 500 }}>₹{row.price} / slot ({row.slotsLeft ?? row.slots} left)</span>
          <span style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.note || "Going to gate..."}
          </span>
        </div>
      )
    },
    { key: "status", header: "Status", accessor: "status", render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: "date", header: "Time", accessor: (row) => new Date(row.createdAt).getTime(), render: (row) => formatDateTime(row.createdAt) },
    {
      key: "actions", header: "Actions", sortable: false,
      render: (row) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }}
          >
            <Trash2 size={14} /> Delete
          </button>
          <button 
            style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#0f172a", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            onClick={(e) => { e.stopPropagation(); handleBlockUser(row.picker); }}
          >
            <Ban size={14} /> Block User
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ marginBottom: "1.5rem", color: "#0f172a" }}>Gate Buddy Moderation</h2>
      
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader size={28} className="spinner" /></div>
      ) : (
        <DataTable columns={columns} data={trips} searchPlaceholder="Search by user name..." pageSize={10} />
      )}
    </div>
  );
};

export default GateBuddyModeration;
