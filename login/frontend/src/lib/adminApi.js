// Shared admin API helper — all requests go through here
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Generic fetch wrapper with error handling
const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}/admin${endpoint}`, {
    headers: headers(),
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ── Students / Users ──────────────────────────────────
export const fetchStudents = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/students?${qs}`);
};

export const banStudent = (id) =>
  apiFetch(`/students/${id}/ban`, { method: "PATCH", body: JSON.stringify({ trustScore: 0 }) });

export const unbanStudent = (id) =>
  apiFetch(`/students/${id}/unban`, { method: "PATCH" });

// ── Marketplace ───────────────────────────────────────
export const fetchMarketplace = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/marketplace?${qs}`);
};

export const removeItem = (id) =>
  apiFetch(`/marketplace/${id}`, { method: "DELETE" });

export const markFakeListing = (id) =>
  apiFetch(`/marketplace/${id}/mark-fake`, { method: "PATCH" });

// ── Gate Trips ────────────────────────────────────────
export const fetchGateTrips = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/gate-trips?${qs}`);
};

export const deleteGateRequest = (id) =>
  apiFetch(`/gate-trips/${id}`, { method: "DELETE" });
