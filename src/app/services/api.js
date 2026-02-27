import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ✅ getCookie robuste (gère les "=" dans les JWT)
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  if (!row) return null;
  const val = row.split("=").slice(1).join("=");
  if (!val || val === "null" || val === "undefined") return null;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
};

api.interceptors.request.use(
  (config) => {
    const token =
      getCookie("token") ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    config.headers = config.headers || {};

    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      const hasToken = getCookie("token") || localStorage.getItem("token");
      if (!hasToken) window.location.replace("/login");
    }
    return Promise.reject(err);
  }
);

export default api;