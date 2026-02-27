// hooks/Useoutlookcalendar.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Helper fetch authentifié */
const apiFetch = async (path, options = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  return { ok: res.ok, status: res.status, data };
};

export const useOutlookCalendar = () => {
  const [events, setEvents] = useState([]);
  const [outlookStatus, setOutlookStatus] = useState({ connected: false, email: null });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // évite double-fetch en StrictMode
  const fetchedRef = useRef(false);

  const handleOutlookDisconnect = useCallback((data) => {
    if (data?.code === "OUTLOOK_NOT_CONNECTED") {
      setOutlookStatus({ connected: false, email: null });
      return true;
    }
    return false;
  }, []);

  const fetchStatus = useCallback(async () => {
    const { ok, data } = await apiFetch("/api/auth/microsoft/status");
    if (ok && data?.connected) {
      setOutlookStatus({ connected: true, email: data.outlookEmail });
    } else {
      setOutlookStatus({ connected: false, email: null });
    }
  }, []);

  /** ✅ Charger events (DB + Outlook sync côté backend) pour un range */
  const fetchEvents = useCallback(
    async (range) => {
      setLoading(true);
      setError(null);

      try {
        const qs =
          range?.startDate && range?.endDate
            ? `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(
                range.endDate
              )}`
            : "";

        const { ok, status, data } = await apiFetch(`/api/calendar/events${qs}`);

        if (status === 401) {
          window.location.href = "/login";
          return;
        }

        if (handleOutlookDisconnect(data)) {
          setError("Votre session Outlook a expiré. Veuillez reconnecter votre compte.");
          setEvents([]);
          return;
        }

        if (!ok) {
          setError(data?.message || "Erreur lors du chargement des événements");
          setEvents([]);
          return;
        }

        setEvents(data?.events || []);
      } catch {
        setError("Impossible de contacter le serveur");
      } finally {
        setLoading(false);
      }
    },
    [handleOutlookDisconnect]
  );

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      await fetchStatus();
      await fetchEvents(); // first load (backend default)
    })();
  }, [fetchStatus, fetchEvents]);

  // Connexion Outlook
  const connectOutlook = useCallback(async () => {
    setError(null);
    try {
      const { ok, data } = await apiFetch("/api/auth/microsoft/connect");
      if (ok && data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Impossible d'initier la connexion Outlook");
      }
    } catch {
      setError("Erreur réseau");
    }
  }, []);

  // Déconnexion Outlook
  const disconnectOutlook = useCallback(async () => {
    try {
      await apiFetch("/api/auth/microsoft/disconnect", { method: "DELETE" });
      setOutlookStatus({ connected: false, email: null });
      // conserve events locaux (source: "app"), retire Outlook
      setEvents((prev) => prev.filter((e) => e.source !== "outlook"));
    } catch {
      setError("Erreur lors de la déconnexion");
    }
  }, []);

  // Créer
  const createEvent = useCallback(
    async (formData) => {
      try {
        const { ok, status, data } = await apiFetch("/api/calendar/events", {
          method: "POST",
          body: JSON.stringify(formData),
        });

        if (status === 401) {
          window.location.href = "/login";
          return { success: false };
        }
        if (handleOutlookDisconnect(data)) {
          setError("Session Outlook expirée. Veuillez reconnecter votre compte.");
          return { success: false, code: "OUTLOOK_NOT_CONNECTED" };
        }
        if (!ok) return { success: false, message: data?.message };

        setEvents((prev) =>
          [...prev, data.event].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        );
        return { success: true };
      } catch {
        return { success: false, message: "Erreur réseau" };
      }
    },
    [handleOutlookDisconnect]
  );

  // Modifier
  const updateEvent = useCallback(
    async (id, formData) => {
      try {
        const { ok, status, data } = await apiFetch(`/api/calendar/events/${id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });

        if (status === 401) {
          window.location.href = "/login";
          return { success: false };
        }
        if (handleOutlookDisconnect(data)) {
          setError("Session Outlook expirée. Veuillez reconnecter votre compte.");
          return { success: false, code: "OUTLOOK_NOT_CONNECTED" };
        }
        if (!ok) return { success: false, message: data?.message };

        setEvents((prev) => prev.map((e) => (e._id === id || e.outlookId === id ? data.event : e)));
        return { success: true };
      } catch {
        return { success: false, message: "Erreur réseau" };
      }
    },
    [handleOutlookDisconnect]
  );

  // Supprimer
  const deleteEvent = useCallback(
    async (id) => {
      try {
        const { ok, status, data } = await apiFetch(`/api/calendar/events/${id}`, {
          method: "DELETE",
        });

        if (status === 401) {
          window.location.href = "/login";
          return { success: false };
        }
        if (handleOutlookDisconnect(data)) {
          setError("Session Outlook expirée. Veuillez reconnecter votre compte.");
          return { success: false, code: "OUTLOOK_NOT_CONNECTED" };
        }
        if (!ok) return { success: false, message: data?.message };

        setEvents((prev) => prev.filter((e) => e._id !== id && e.outlookId !== id));
        return { success: true };
      } catch {
        return { success: false, message: "Erreur réseau" };
      }
    },
    [handleOutlookDisconnect]
  );

  // ✅ Sync manuelle sur range
  const syncNow = useCallback(
    async (range) => {
      setSyncing(true);
      setError(null);
      try {
        const body =
          range?.startDate && range?.endDate ? JSON.stringify(range) : JSON.stringify({});

        const { ok, status, data } = await apiFetch("/api/calendar/sync", {
          method: "POST",
          body,
        });

        if (status === 401) {
          window.location.href = "/login";
          return;
        }
        if (handleOutlookDisconnect(data)) {
          setError("Session Outlook expirée. Veuillez reconnecter votre compte.");
          return;
        }
        if (!ok) {
          setError(data?.message || "Erreur sync");
          return;
        }

        await fetchEvents(range);
      } catch {
        setError("Erreur réseau lors de la synchronisation");
      } finally {
        setSyncing(false);
      }
    },
    [handleOutlookDisconnect, fetchEvents]
  );

  return {
    events,
    outlookStatus,
    loading,
    syncing,
    error,
    setError,
    connectOutlook,
    disconnectOutlook,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents, // ✅ important for range reload
    syncNow,
  };
};
