// src/app/services/auth.api.js
import api from "./api";

// ✅ Helper pour écrire un cookie lisible côté client ET middleware
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function removeCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ✅ Login : on stocke dans localStorage ET dans les cookies
export const login = async (email, password) => {
  const res = await api.post("/users/login", { email, password });

  // ← Adapte selon ce que ton backend renvoie
  //   ex: res.data.token, res.data.user.role, etc.
  const token = res.data?.token;
  const role = res.data?.user?.role || res.data?.role;

  if (token) {
    localStorage.setItem("token", token);
    setCookie("token", token);
  }
  if (role) {
    localStorage.setItem("role", role);
    setCookie("role", role);
  }

  return res;
};

export const logout = () => {
  const token =
    localStorage.getItem("token") ||
    (document.cookie.match(/(?:^|;\s*)token=([^;]*)/)?.[1] ?? "");

  // ✅ Nettoyer localStorage ET cookies
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  removeCookie("token");
  removeCookie("role");

  return api.post(
    "/users/logout",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    }
  );
};

// Password reset APIs
export const forgotPassword = (email) =>
  api.post("/password/forgot", { email });

export const verifyResetCode = (email, code) =>
  api.post("/password/verify-code", { email, code });

export const resetPassword = (email, code, newPassword, confirmPassword) =>
  api.post("/password/reset", { email, code, newPassword, confirmPassword });

export const resendCode = (email) =>
  api.post("/password/resend-code", { email });