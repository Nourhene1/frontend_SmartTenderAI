// services/tender.api.js
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || getCookie("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getCookie(name) {
  const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  if (!row) return null;
  const val = row.split("=").slice(1).join("=");
  return val && val !== "null" ? decodeURIComponent(val) : null;
}

/* ── PUBLIC (candidats) ─────────────────────────────────── */
export const getPublicTenders       = ()         => api.get("/tenders/public");
export const getPublicTenderById    = (id)       => api.get(`/tenders/public/${id}`);
export const applyToTender          = (id, data) => api.post(`/tenders/public/${id}/apply`, data);

/* ── ADMIN ───────────────────────────────────────────────── */
export const analyzeTenderPDF = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/tenders/analyze", fd, { headers: { "Content-Type": "multipart/form-data" } });
};
export const getTenders            = ()             => api.get("/tenders");
export const getTenderById         = (id)           => api.get(`/tenders/${id}`);
export const deleteTender          = (id)           => api.delete(`/tenders/${id}`);
export const updateTenderStatus    = (id, status)   => api.patch(`/tenders/${id}/status`, { status });

/* ── Documents ───────────────────────────────────────────── */
export const generateResponseDocument = (tenderId, candidateIds, companyInfo = {}) =>
  api.post("/documents/generate-response", { tenderId, candidateIds, companyInfo }, { responseType: "blob" });

export const generateCandidateProfile = (candidateId, tenderId = null) =>
  api.post("/documents/generate-profile", { candidateId, tenderId }, { responseType: "blob" });

export const getDocumentHistory = () => api.get("/documents/history");

export function downloadBlob(blob, filename) {
  // ✅ FIX: append to DOM + délai revoke pour laisser le browser démarrer le dl
  const url = URL.createObjectURL(new Blob([blob], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}