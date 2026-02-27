import api from "./api";

/**
 * GET /roles
 * Admin only
 */
export const getRoles = () => api.get("/roles");

/**
 * POST /roles
 * Admin only
 * body: { name }
 */
export const createRole = (name) =>
  api.post("/roles", { name });

/**
 * DELETE /roles/:id
 * Admin only
 */
export const deleteRole = (id) =>
  api.delete(`/roles/${id}`);

export const updateRole = (id, name) =>
  api.put(`/roles/${id}`, { name });