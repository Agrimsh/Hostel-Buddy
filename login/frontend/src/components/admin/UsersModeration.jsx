import { useState, useEffect, useCallback } from "react";
import { Ban, CheckCircle, Loader } from "lucide-react";
import DataTable from "./shared/DataTable";
import Badge from "./shared/Badge";
import { fetchStudents, banStudent as apiBan, unbanStudent as apiUnban } from "../../lib/adminApi";
import { toast } from "react-toastify";
import { formatName } from "../../utils/formatName";
import "./UsersModeration.css";

const UsersModeration = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStudents();
      setUsers(data.students || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleBan = async (id) => {
    try {
      await apiBan(id);
      toast.success("User banned");
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to ban user");
    }
  };

  const handleUnban = async (id) => {
    try {
      await apiUnban(id);
      toast.success("User unbanned");
      loadUsers();
    } catch (err) {
      toast.error(err.message || "Failed to unban user");
    }
  };

  const columns = [
    {
      key: "name",
      header: "User",
      accessor: (row) => formatName(row.email),
      render: (row) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>{formatName(row.email)}</span>
          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{row.email}</span>
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      accessor: "roomNumber",
      render: (row) => row.roomNumber || "N/A"
    },
    {
      key: "role",
      header: "Role",
      accessor: "role",
      render: (row) => <Badge variant="purple">{row.role || "student"}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (row.isBanned ? "banned" : "active"),
      render: (row) => {
        if (row.isBanned) return <Badge variant="danger">Banned</Badge>;
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (row) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {row.role === "admin" ? (
            <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>No actions</span>
          ) : row.isBanned ? (
            <button
              style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#10b981", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              onClick={(e) => { e.stopPropagation(); handleUnban(row._id); }}
            >
              <CheckCircle size={14} /> Unban
            </button>
          ) : (
            <button
              style={{ padding: "0.3rem 0.6rem", border: "none", borderRadius: "4px", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              onClick={(e) => { e.stopPropagation(); handleBan(row._id); }}
            >
              <Ban size={14} /> Ban
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", color: "#0f172a" }}>Users Moderation</h2>
      
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader size={28} className="spinner" /></div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          searchPlaceholder="Search users by name or email..." 
          pageSize={10} 
        />
      )}
    </div>
  );
};

export default UsersModeration;
