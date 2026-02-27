import api from "./api";

/* =========================
   USERS (ADMIN)
========================= */

// GET all users
export const getUsers = () => api.get("/users");

// CREATE user — ✅ /admin/create (sans mot de passe, envoie email d'activation)
export const createUser = (payload) => api.post("/users/admin/create", payload);

// UPDATE user
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);

// DELETE user
export const deleteUser = (id) => api.delete(`/users/${id}`);