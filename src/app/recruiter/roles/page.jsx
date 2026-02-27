"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Trash2, Edit2 } from "lucide-react";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/role.api";

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function normalizeRoleName(name) {
  return safeStr(name).toUpperCase().replace(/\s+/g, "_");
}

/* ================= PAGE ================= */
export default function GestionRolesPage() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  // search
  const [q, setQ] = useState("");

  // add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [roleName, setRoleName] = useState("");

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  // delete modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // alerts
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  // ✅ CORRIGÉ : ajout du paramètre clearMessages pour ne pas effacer le succès après une action
  async function fetchRoles(clearMessages = true) {
    if (clearMessages) {
      setError("");
      setSuccess("");
    }
    setLoading(true);
    try {
      const res = await getRoles();
      const data = res?.data;
      const arr = Array.isArray(data) ? data : data?.roles || [];
      setRoles(arr);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        safeStr(e?.message) ||
        "Erreur lors du chargement des rôles"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRole(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalName = normalizeRoleName(roleName);
    if (!finalName) {
      setError("Veuillez saisir le nom du rôle.");
      return;
    }

    setLoading(true);
    try {
      await createRole(finalName);
      setSuccess("Rôle ajouté avec succès");
      setRoleName("");
      setOpenAdd(false);
      await fetchRoles(false); // ✅ Ne pas effacer le message de succès
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        safeStr(e?.message) ||
        "Erreur lors de l'ajout du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditRole(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalName = normalizeRoleName(editName);
    if (!finalName) {
      setError("Veuillez saisir le nom du rôle.");
      return;
    }

    setLoading(true);
    try {
      await updateRole(editId, finalName);
      setSuccess("Rôle modifié avec succès");
      setOpenEdit(false);
      setEditId(null);
      setEditName("");
      await fetchRoles(false); // ✅ Ne pas effacer le message de succès
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        safeStr(e?.message) ||
        "Erreur lors de la modification du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteRole() {
    if (!roleToDelete) return;
    setLoading(true);
    try {
      await deleteRole(roleToDelete.id);
      setSuccess("Rôle supprimé");
      setOpenDeleteModal(false);
      setRoleToDelete(null);
      await fetchRoles(false); // ✅ Ne pas effacer le message de succès
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        safeStr(e?.message) ||
        "Erreur lors de la suppression du rôle"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRoles = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    if (!query) return roles;
    return roles.filter((r) =>
      safeStr(r?.name).toLowerCase().includes(query)
    );
  }, [roles, q]);

  const sortedRoles = [...filteredRoles].sort((a, b) =>
    safeStr(a?.name).localeCompare(safeStr(b?.name))
  );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 px-4 sm:px-6 py-10 transition-colors duration-300">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
          Liste des rôles
        </h1>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-5 py-4 text-sm font-semibold text-red-700 dark:text-red-400 transition-colors">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-5 py-4 text-sm font-semibold text-green-700 dark:text-green-400 transition-colors">
            {success}
          </div>
        )}

        {/* SEARCH + ADD */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E8F2F] dark:text-emerald-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un rôle…"
              className="w-full rounded-full bg-white dark:bg-gray-800 shadow-sm 
                border border-gray-100 dark:border-gray-700
                pl-11 sm:pl-12 pr-4 sm:pr-5 py-3 text-sm 
                text-gray-800 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                outline-none
                focus:border-[#6CB33F] dark:focus:border-emerald-500 
                focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                transition-colors"
            />
          </div>

          <button
            onClick={() => setOpenAdd(true)}
            className="rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
              px-6 py-3 text-sm font-semibold text-white whitespace-nowrap transition-colors"
          >
            Ajouter un rôle
          </button>
        </div>

        {/* TABLE - VERSION RESPONSIVE */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">
                    Nom du rôle
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedRoles.map((r) => {
                  const id = r?._id || r?.id;
                  const name = safeStr(r?.name);

                  return (
                    <tr key={id} className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <span className="inline-flex rounded-full
                          bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400
                          border border-[#d7ebcf] dark:border-gray-600
                          px-3 sm:px-4 py-1 text-xs font-semibold transition-colors">
                          {name}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-2 sm:gap-4">
                          <button
                            onClick={() => {
                              setOpenEdit(true);
                              setEditId(id);
                              setEditName(name);
                            }}
                            className="text-[#4E8F2F] dark:text-emerald-400 hover:text-[#3a6b23] dark:hover:text-emerald-300 transition-colors"
                            aria-label="Modifier"
                          >
                            <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>

                          <button
                            onClick={() => {
                              setRoleToDelete({ id, name });
                              setOpenDeleteModal(true);
                            }}
                            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= ADD MODAL ================= */}
      {openAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setOpenAdd(false)}
          />

          {/* MODAL */}
          <div className="relative z-10 w-full max-w-lg sm:max-w-2xl lg:max-w-3xl rounded-2xl sm:rounded-[28px] bg-white dark:bg-gray-800 shadow-xl transition-colors duration-300">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Ajouter un rôle
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                  Créez un nouveau rôle pour gérer les autorisations.
                </p>
              </div>

              <button
                onClick={() => setOpenAdd(false)}
                className="rounded-full p-2 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[65vh] overflow-auto px-5 sm:px-8 py-5 sm:py-6">
              <form onSubmit={handleAddRole} className="space-y-6">

                <div>
                  <label className="mb-2 block text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-700 dark:text-gray-300">
                    Nom du rôle
                  </label>
                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="ex : HR_MANAGER"
                    className="w-full rounded-full border border-slate-200 dark:border-gray-600 
                      bg-white dark:bg-gray-700 px-4 sm:px-5 py-2.5 sm:py-3 text-sm 
                      text-gray-800 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-500
                      outline-none
                      focus:border-[#6CB33F] dark:focus:border-emerald-500 
                      focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                      transition-colors"
                  />
                </div>

                {/* FOOTER */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenAdd(false)}
                    className="w-full sm:w-auto rounded-full border border-slate-300 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto rounded-full bg-[#6CB33F] dark:bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {openEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* OVERLAY */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setOpenEdit(false)}
          />

          {/* MODAL */}
          <div className="relative z-10 w-full max-w-lg sm:max-w-2xl lg:max-w-3xl rounded-2xl sm:rounded-[28px] bg-white dark:bg-gray-800 shadow-xl transition-colors duration-300">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-4 px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Modifier le rôle
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                  Mettez à jour le nom du rôle sélectionné.
                </p>
              </div>

              <button
                onClick={() => setOpenEdit(false)}
                className="rounded-full p-2 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[65vh] overflow-auto px-5 sm:px-8 py-5 sm:py-6">
              <form onSubmit={handleEditRole} className="space-y-6">

                <div>
                  <label className="mb-2 block text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-700 dark:text-gray-300">
                    Nouveau nom du rôle
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="ex : IT_MANAGER"
                    className="w-full rounded-full border border-slate-200 dark:border-gray-600 
                      bg-white dark:bg-gray-700 px-4 sm:px-5 py-2.5 sm:py-3 text-sm 
                      text-gray-800 dark:text-gray-100
                      placeholder-gray-400 dark:placeholder-gray-500
                      outline-none
                      focus:border-[#6CB33F] dark:focus:border-emerald-500 
                      focus:ring-1 focus:ring-[#6CB33F] dark:focus:ring-emerald-500
                      transition-colors"
                  />
                </div>

                {/* FOOTER */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenEdit(false)}
                    className="w-full sm:w-auto rounded-full border border-slate-300 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto rounded-full bg-[#6CB33F] dark:bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* ================= DELETE MODAL ================= */}
      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setOpenDeleteModal(false)} />
          <div className="relative z-10 w-full max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl transition-colors duration-300">
            <h2 className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400">
              Supprimer le rôle
            </h2>
            <p className="mt-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Voulez-vous vraiment supprimer le rôle <span className="font-bold text-gray-900 dark:text-white">{roleToDelete?.name}</span> ?
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <button 
                onClick={() => setOpenDeleteModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 font-semibold hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteRole}
                className="w-full sm:w-auto bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white px-6 py-2.5 rounded-full font-semibold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}