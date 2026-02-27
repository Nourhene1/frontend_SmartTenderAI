"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useOutlookCalendar } from "../hooks/Useoutlookcalendar";
import { Trash2 } from "lucide-react";

/* ================= THEME OPTYLAB ================= */
const THEME_LIGHT = {
  bgPage: "#F1FAF4",
  surface: "#FFFFFF",
  surface2: "#F7FAF8",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",

  primary: "#6CB33F",
  primaryDark: "#4E8F2F",
  primarySoft: "#E9F5E3",
  todaySoft: "#F0FAF0",

  evBg: "#E9F5E3",
  evText: "#2E6B1F",
  evBorder: "#6CB33F",

  evAltBg: "#EAF2FF",
  evAltText: "#1E3A8A",
  evAltBorder: "#2563EB",
};

const THEME_DARK = {
  bgPage: "#0B1220",
  surface: "#0F1A2F",
  surface2: "#0B1220",
  border: "#24324A",
  text: "#E5E7EB",
  muted: "#94A3B8",

  primary: "#6CB33F",
  primaryDark: "#5AAE35",
  primarySoft: "rgba(108,179,63,0.14)",
  todaySoft: "rgba(108,179,63,0.10)",

  evBg: "rgba(108,179,63,0.16)",
  evText: "#D9F5D0",
  evBorder: "#6CB33F",

  evAltBg: "rgba(59,130,246,0.16)",
  evAltText: "#DBEAFE",
  evAltBorder: "#3B82F6",
};

/* ================= ICONS ================= */
const OutlookIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill={color} />
    <path
      d="M12 6C8.686 6 6 8.686 6 12s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"
      fill="white"
    />
    <circle cx="12" cy="12" r="2" fill="white" />
  </svg>
);

const SyncIcon = ({ spinning }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const PrintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#5059C9">
    <path d="M19.5 8.5h-3v7a3.5 3.5 0 0 1-7 0v-7h-3a.5.5 0 0 0-.5.5v7a7 7 0 0 0 14 0V9a.5.5 0 0 0-.5-.5z" />
    <circle cx="12" cy="4.5" r="2.5" />
  </svg>
);

const ChevLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ================= CONSTS ================= */
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ================= EVENT STYLE ================= */
function eventStyle(ev, T) {
  const isOutlook = ev?.source === "outlook";
  return {
    background: isOutlook ? T.evBg : T.evAltBg,
    color: isOutlook ? T.evText : T.evAltText,
    borderLeft: `3px solid ${isOutlook ? T.evBorder : T.evAltBorder}`,
  };
}

/* ================= STYLES FACTORY ================= */
const makeStyles = (T, isDark) => ({
  outlookBtn: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "7px 12px",
    background: T.surface,
    cursor: "pointer",
    fontSize: 13,
    color: T.text,
  },
  viewBtn: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: T.border,
    background: "transparent",
    padding: "7px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    color: T.text,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    background: isDark ? "rgba(239,68,68,0.12)" : "#FEE2E2",
    color: isDark ? "#FCA5A5" : "#991B1B",
    padding: "10px 16px",
    fontSize: 13,
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    alignItems: "center",
  },
  alertBanner: {
    background: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7",
    color: isDark ? "#FCD34D" : "#92400E",
    padding: "10px 16px",
    fontSize: 13,
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    alignItems: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    background: T.surface,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(0,0,0,.35)",
    border: `1px solid ${T.border}`,
  },
  btnOutlookSave: {
    border: "none",
    borderRadius: 10,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
    background: T.primary,
    color: "#fff",
  },
  fieldIcon: { width: 26, textAlign: "center", color: T.muted, paddingTop: 3 },
  fieldInput: {
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 13,
    outline: "none",
    background: T.surface,
    color: T.text,
  },
  attendeeChip: {
    background: T.surface2,
    border: `1px solid ${T.border}`,
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    color: T.text,
  },
  btnSmall: {
    border: "none",
    borderRadius: 10,
    padding: "9px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  btnSecondary: {
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  btnPrimary: {
    border: "none",
    background: T.primary,
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
  },
  toggle: { width: 36, height: 20, borderRadius: 999, position: "relative", cursor: "pointer" },
  toggleThumb: { width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, transition: "transform .15s" },
});

function monthRange(d) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}
function weekRange(weekStart) {
  const start = new Date(weekStart); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}
function dayRange(d) {
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/* ================= CONFIRMATION MODAL ================= */
const ConfirmDeleteModal = ({ T, S, onConfirm, onCancel }) => {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 420 }}>
        <div style={{
          padding: "24px",
          background: T.surface,
          textAlign: "center",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
  <Trash2 size={48} color="#EF4444" />
</div>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 800, 
            color: T.text, 
            marginBottom: 12 
          }}>
            Confirmer la suppression ?
          </h3>
          <p style={{ 
            fontSize: 14, 
            color: T.muted, 
            marginBottom: 28,
            lineHeight: 1.5
          }}>
            Vous allez supprimer définitivement cet événement.<br/>
            Cette action est irréversible.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              onClick={onCancel}
              style={{
                ...S.btnSecondary,
                padding: "12px 24px",
                fontSize: 14
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              style={{
                border: "none",
                background: "#EF4444",
                color: "#fff",
                borderRadius: 12,
                padding: "12px 28px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= EVENT MODAL ================= */
const EventModal = ({ T, S, event, defaultDate, defaultHour, onSave, onClose, onDelete }) => {
  const pad = (n) => String(n).padStart(2, "0");
  const toLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };
  const initStart = event
    ? toLocal(event.startDate)
    : defaultDate
      ? `${defaultDate}T${pad(defaultHour || 9)}:00`
      : "";
  const initEnd = event
    ? toLocal(event.endDate)
    : defaultDate
      ? `${defaultDate}T${pad((defaultHour || 9) + 1)}:00`
      : "";

  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    start: initStart,
    end: initEnd,
    location: event?.location || "",
    isAllDay: event?.isAllDay || false,
    attendees: event?.attendees || [],
    isTeams: false,
  });

  const [attendeeInput, setAttendeeInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const addAttendee = () => {
    const email = attendeeInput.trim();
    if (!email || form.attendees.find((a) => a.email === email)) return;
    setForm({ ...form, attendees: [...form.attendees, { email, name: email }] });
    setAttendeeInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.start || !form.end) return;
    onSave({
      ...form,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
    });
  };

  return (
    <>
      <div style={S.overlay}>
        <div style={{ ...S.modal, maxWidth: 680 }}>
          <div
            style={{
              background: T.surface2,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontWeight: 900, fontSize: 14, color: T.text }}>
              {event ? "Modifier l'événement" : "Nouvel événement"}
            </span>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {event && (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  style={{
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    color: T.text,
                    borderRadius: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  Supprimer
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("outlook-form")
                    ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
                }
                style={S.btnOutlookSave}
              >
                Enregistrer
              </button>

              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 20,
                  color: T.muted,
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            style={{
              background: T.surface,
              padding: "8px 20px",
              display: "flex",
              gap: 10,
              borderBottom: `1px solid ${T.border}`,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 13,
                color: form.isTeams ? "#5059C9" : T.muted,
                fontWeight: form.isTeams ? 700 : 400,
              }}
            >
              <div
                style={{ ...S.toggle, background: form.isTeams ? "#5059C9" : (T.border || "#D1D5DB") }}
                onClick={() => setForm({ ...form, isTeams: !form.isTeams })}
              >
                <div
                  style={{
                    ...S.toggleThumb,
                    transform: form.isTeams ? "translateX(16px)" : "translateX(2px)",
                  }}
                />
              </div>
              <TeamsIcon /> Réunion Teams
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: T.muted }}>
              <input
                type="checkbox"
                checked={form.isAllDay}
                onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
              />
              Journée entière
            </label>
          </div>

          <form id="outlook-form" onSubmit={handleSubmit} style={{ padding: 0 }}>
            <div style={{ padding: "16px 20px 0" }}>
              <input
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom: `2px solid ${T.primary}`,
                  outline: "none",
                  fontSize: 20,
                  fontWeight: 800,
                  color: T.text,
                  padding: "4px 0",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "transparent",
                }}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ajoutez un titre"
                required
              />
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={S.fieldIcon}>👥</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    {form.attendees.map((a, i) => (
                      <span key={i} style={S.attendeeChip}>
                        {a.name || a.email}
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, attendees: form.attendees.filter((_, j) => j !== i) })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            marginLeft: 4,
                            color: T.muted,
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ ...S.fieldInput, flex: 1 }}
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())}
                      placeholder="Invitez des participants (email)"
                    />
                    <button
                      type="button"
                      onClick={addAttendee}
                      style={{ ...S.btnSmall, background: T.primary, color: "#fff" }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={S.fieldIcon}>🕐</span>
                <input
                  type="datetime-local"
                  style={S.fieldInput}
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                  required
                  disabled={form.isAllDay}
                />
                <span style={{ color: T.muted, fontSize: 13 }}>à</span>
                <input
                  type="datetime-local"
                  style={S.fieldInput}
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  required
                  disabled={form.isAllDay}
                />
                {form.isAllDay && (
                  <input
                    type="date"
                    style={S.fieldInput}
                    value={form.start?.slice(0, 10)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start: e.target.value + "T00:00",
                        end: e.target.value + "T23:59",
                      })
                    }
                    required
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={S.fieldIcon}>📍</span>
                <input
                  style={{ ...S.fieldInput, flex: 1 }}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Rechercher un lieu"
                />
              </div>

              {form.isTeams && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={S.fieldIcon}>
                    <TeamsIcon />
                  </span>
                  <span style={{ fontSize: 13, color: "#5059C9", fontWeight: 700 }}>
                    Lien de réunion Teams généré automatiquement
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={S.fieldIcon}>≡</span>
                <textarea
                  style={{ ...S.fieldInput, flex: 1, height: 90, resize: "vertical" }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ajoutez une description..."
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                padding: "12px 20px",
                borderTop: `1px solid ${T.border}`,
                background: T.surface2,
              }}
            >
              <button type="button" onClick={onClose} style={S.btnSecondary}>
                Annuler
              </button>
              <button type="submit" style={S.btnPrimary}>
                Enregistrer & sync Outlook
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showConfirm && (
        <ConfirmDeleteModal
          T={T}
          S={S}
          onConfirm={() => {
            onDelete(event._id?.toString() || event.outlookId);
            setShowConfirm(false);
            onClose();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

/* ================= VUE MOIS ================= */
const MonthView = ({ T, events, today, year, month, onDayClick, onEventClick }) => {
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.startDate) return;
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const cells = [];
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = offset - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, cur: false });

    return cells;
  }, [year, month]);

  const isToday = (d, cur) =>
    cur && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div style={{ flex: 1, overflow: "auto", background: T.surface }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface2,
        }}
      >
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              padding: "8px 0",
              fontSize: 11,
              fontWeight: 900,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {days.map((cell, i) => {
          const key = cell.cur ? `${year}-${month}-${cell.day}` : null;
          const dayEvs = key ? eventsByDay[key] || [] : [];
          const tod = isToday(cell.day, cell.cur);

          return (
            <div
              key={i}
              onClick={() => cell.cur && onDayClick(cell.day)}
              style={{
                minHeight: 110,
                padding: 6,
                borderRight: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                background: cell.cur ? T.surface : T.surface2,
                cursor: cell.cur ? "pointer" : "default",
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: tod ? T.primary : "transparent",
                    color: tod ? "#fff" : cell.cur ? T.text : "rgba(148,163,184,.55)",
                    fontSize: 13,
                    fontWeight: tod ? 900 : 700,
                  }}
                >
                  {cell.day}
                </span>
              </div>

              {dayEvs.slice(0, 3).map((ev, ei) => {
                const es = eventStyle(ev, T);
                return (
                  <div
                    key={ei}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 8,
                      marginBottom: 4,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 900,
                      ...es,
                    }}
                  >
                    {!ev.isAllDay &&
                      `${new Date(ev.startDate).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} `}
                    {ev.title}
                  </div>
                );
              })}

              {dayEvs.length > 3 && (
                <div style={{ fontSize: 10, color: T.muted, paddingLeft: 6 }}>
                  +{dayEvs.length - 3} autres
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= VUE SEMAINE ================= */
const WeekView = ({ T, weekStart, events, today, onSlotClick, onEventClick }) => {
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!ev.startDate) return;
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const isToday = (d) => d.toDateString() === today.toDateString();

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", background: T.surface }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "50px repeat(7, 1fr)",
          borderBottom: `1px solid ${T.border}`,
          background: T.surface2,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div />
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderLeft: `1px solid ${T.border}` }}>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                textTransform: "uppercase",
                fontWeight: 900,
                letterSpacing: "0.05em",
              }}
            >
              {DAYS_SHORT[i]}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                marginTop: 2,
                background: isToday(d) ? T.primary : "transparent",
                color: isToday(d) ? "#fff" : T.text,
                fontSize: 15,
                fontWeight: 900,
              }}
            >
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "50px repeat(7, 1fr)", flex: 1 }}>
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div
              style={{
                fontSize: 10,
                color: T.muted,
                textAlign: "right",
                paddingRight: 6,
                paddingTop: 2,
                borderBottom: `1px solid ${T.border}`,
                height: 52,
                background: T.surface2,
              }}
            >
              {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>

            {days.map((d, di) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const slotEvs = (eventsByDay[key] || []).filter((ev) => new Date(ev.startDate).getHours() === h);

              return (
                <div
                  key={di}
                  onClick={() => onSlotClick(d, h)}
                  style={{
                    borderLeft: `1px solid ${T.border}`,
                    borderBottom: `1px solid ${T.border}`,
                    height: 52,
                    cursor: "pointer",
                    position: "relative",
                    background: isToday(d) ? T.todaySoft : T.surface,
                  }}
                >
                  {slotEvs.map((ev, ei) => {
                    const es = eventStyle(ev, T);
                    return (
                      <div
                        key={ei}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev);
                        }}
                        style={{
                          position: "absolute",
                          top: 2,
                          left: 2,
                          right: 2,
                          borderRadius: 10,
                          padding: "2px 6px",
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: "pointer",
                          zIndex: 1,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          ...es,
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ================= VUE JOUR ================= */
const DayView = ({ T, date, events, onSlotClick, onEventClick }) => {
  const dayEvs = useMemo(() => {
    return events.filter((ev) => {
      if (!ev.startDate) return false;
      const d = new Date(ev.startDate);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
  }, [events, date]);

  const byHour = useMemo(() => {
    const map = {};
    dayEvs.forEach((ev) => {
      const h = new Date(ev.startDate).getHours();
      if (!map[h]) map[h] = [];
      map[h].push(ev);
    });
    return map;
  }, [dayEvs]);

  return (
    <div style={{ flex: 1, overflow: "auto", background: T.surface }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr" }}>
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                textAlign: "right",
                paddingRight: 8,
                paddingTop: 4,
                borderBottom: `1px solid ${T.border}`,
                height: 60,
                background: T.surface2,
              }}
            >
              {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </div>

            <div
              onClick={() => onSlotClick(date, h)}
              style={{
                borderLeft: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                height: 60,
                cursor: "pointer",
                position: "relative",
                padding: 4,
                background: T.surface,
              }}
            >
              {(byHour[h] || []).map((ev, ei) => {
                const es = eventStyle(ev, T);
                return (
                  <div
                    key={ei}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    style={{
                      borderRadius: 10,
                      padding: "6px 10px",
                      marginBottom: 4,
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                      ...es,
                    }}
                  >
                    {new Date(ev.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} —{" "}
                    {ev.title}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ================= MINI CALENDAR (LEFT SIDEBAR) ================= */
const MiniMonth = ({ T, S, currentDate, selectedDate, onChangeMonth, onPickDay }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const arr = [];
    const prevDays = new Date(year, month, 0).getDate();

    for (let i = offset - 1; i >= 0; i--) arr.push({ day: prevDays - i, cur: false });
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, cur: true });
    while (arr.length % 7 !== 0) arr.push({ day: arr.length - daysInMonth - offset + 1, cur: false });

    return arr;
  }, [year, month]);

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d) =>
    selectedDate &&
    d === selectedDate.getDate() &&
    month === selectedDate.getMonth() &&
    year === selectedDate.getFullYear();

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: T.surface }}>
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: T.surface2,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <button onClick={() => onChangeMonth(-1)} style={S.navBtn}>
          <ChevLeft />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 900, color: T.text, fontSize: 13 }}>
          {MONTHS[month]} {year}
        </div>
        <button onClick={() => onChangeMonth(1)} style={S.navBtn}>
          <ChevRight />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 10px 6px" }}>
        {DAYS_SHORT.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: T.muted, fontWeight: 900, textTransform: "uppercase" }}>
            {d[0]}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: "0 10px 12px" }}>
        {cells.map((c, i) => {
          const disabled = !c.cur;
          const tod = c.cur && isToday(c.day);
          const sel = c.cur && isSelected(c.day);

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => c.cur && onPickDay(new Date(year, month, c.day))}
              style={{
                height: 30,
                borderRadius: 10,
                border: sel ? `2px solid ${T.primary}` : `1px solid transparent`,
                background: tod ? T.primarySoft : T.surface,
                color: disabled ? "rgba(148,163,184,.55)" : T.text,
                fontWeight: sel ? 900 : 700,
                cursor: disabled ? "default" : "pointer",
              }}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const OutlookCalendar = ({ onDateSelect } = {}) => {
  const {
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
    fetchEvents,
    syncNow,
  } = useOutlookCalendar();

  const today = new Date();

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const T = isDark ? THEME_DARK : THEME_LIGHT;
  const S = useMemo(() => makeStyles(T, isDark), [T, isDark]);

  const [view, setView] = useState("month"); // month | week | day
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [dayDate, setDayDate] = useState(new Date(today));
  const [showModal, setShowModal] = useState(false);
  const [editingEv, setEditingEv] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [defaultHour, setDefaultHour] = useState(9);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!outlookStatus?.connected) return;
    let range;
    if (view === "month") range = monthRange(currentDate);
    else if (view === "week") range = weekRange(weekStart);
    else range = dayRange(dayDate);
    fetchEvents(range);
  }, [view, currentDate, weekStart, dayDate, outlookStatus?.connected, fetchEvents]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = (dir) => {
    if (view === "month") setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else if (view === "week")
      setWeekStart((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + dir * 7);
        return nd;
      });
    else
      setDayDate((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + dir);
        return nd;
      });
  };

  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    setWeekStart(d);
    setDayDate(new Date(today));
  };

  const getNavLabel = () => {
    if (view === "month") return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      return `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    }
    return `${DAYS_FULL[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1]} ${dayDate.getDate()} ${MONTHS[dayDate.getMonth()]} ${dayDate.getFullYear()}`;
  };

  const openNewEventModal = (date, hour = 9) => {
    if (onDateSelect) {
      onDateSelect(date);
      return;
    }
    const y = date.getFullYear(),
      m = String(date.getMonth() + 1).padStart(2, "0"),
      d = String(date.getDate()).padStart(2, "0");
    setDefaultDate(`${y}-${m}-${d}`);
    setDefaultHour(hour);
    setEditingEv(null);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    const result = editingEv
      ? await updateEvent(editingEv._id?.toString() || editingEv.outlookId, formData)
      : await createEvent(formData);

    if (result.success) {
      showToast(editingEv ? " Mis à jour !" : " Créé !");
      setShowModal(false);
      setEditingEv(null);
    } else {
      showToast(result.message || "Erreur", "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteEvent(id);
    if (result.success) showToast(" Supprimé");
    else showToast("Erreur", "error");
  };

  const handleEventClick = (ev) => {
    setEditingEv(ev);
    setShowModal(true);
  };

  const handlePrint = () => window.print();
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: "Calendrier", text: "Mon calendrier Optylab", url: window.location.href });
    else {
      navigator.clipboard.writeText(window.location.href);
      showToast("🔗 Lien copié !");
    }
  };

  const handlePickDay = (date) => {
    setDayDate(date);
    setView("day");
  };

  const handleMiniChangeMonth = (dir) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    setView("month");
  };

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", background: T.bgPage, padding: "18px 16px" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}</style>

      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
          background: T.surface,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: isDark ? "0 18px 70px rgba(0,0,0,.45)" : "0 18px 60px rgba(17,24,39,.08)",
          border: `1px solid ${T.border}`,
          minHeight: 760,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div style={{ background: T.primary, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, height: 46 }}>
          <OutlookIcon color={T.primaryDark} />
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 15, marginRight: "auto" }}>Calendrier</span>

          {outlookStatus.connected ? (
            <>
              <span style={{ color: "rgba(255,255,255,.9)", fontSize: 12, fontWeight: 800 }}>
                {outlookStatus.email}
              </span>
              <button
                onClick={disconnectOutlook}
                style={{
                  background: "rgba(255,255,255,.18)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              onClick={connectOutlook}
              style={{
                background: "#fff",
                border: "none",
                color: T.primaryDark,
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Connecter Outlook
            </button>
          )}
        </div>

        <div
          style={{
            background: T.surface2,
            borderBottom: `1px solid ${T.border}`,
            padding: "10px 16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => {
              setEditingEv(null);
              setDefaultDate(null);
              setDefaultHour(9);
              setShowModal(true);
            }}
            style={{
              ...S.outlookBtn,
              background: T.primary,
              color: "#fff",
              border: "none",
              fontWeight: 900,
            }}
          >
            + Nouvel événement
          </button>

          <div style={{ width: 1, height: 24, background: isDark ? "#1E2A40" : "#D1D5DB" }} />

          {outlookStatus.connected && (
            <button
              onClick={async () => {
                let range;
                if (view === "month") range = monthRange(currentDate);
                else if (view === "week") range = weekRange(weekStart);
                else range = dayRange(dayDate);

                await syncNow(range);
              }}
              style={S.outlookBtn}
              disabled={syncing}
            >
              <SyncIcon spinning={syncing} /> Synchroniser
            </button>
          )}

          <button onClick={handleShare} style={S.outlookBtn}>
            <ShareIcon /> Partager
          </button>
          <button onClick={handlePrint} style={S.outlookBtn}>
            <PrintIcon /> Imprimer
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  ...S.viewBtn,
                  borderColor: view === v ? T.primary : T.border,
                  background: view === v ? T.primarySoft : "transparent",
                  color: view === v ? T.primaryDark : T.text,
                  fontWeight: view === v ? 900 : 800,
                }}
              >
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={S.errorBanner}>
            ❌ {error}{" "}
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8, color: "inherit" }}>
              ✕
            </button>
          </div>
        )}

        {!outlookStatus.connected && (
          <div style={S.alertBanner}>
            ⚠️ Connectez Outlook pour synchroniser.
            <button
              onClick={connectOutlook}
              style={{
                marginLeft: 12,
                background: T.primary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Connecter
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${T.border}`,
            background: T.surface,
          }}
        >
          <button onClick={() => navigate(-1)} style={S.navBtn}>
            <ChevLeft />
          </button>
          <button onClick={() => navigate(1)} style={S.navBtn}>
            <ChevRight />
          </button>
          <button
            onClick={goToday}
            style={{
              ...S.outlookBtn,
              fontWeight: 900,
              color: T.primaryDark,
              border: `1px solid ${T.primary}`,
            }}
          >
            Aujourd'hui
          </button>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: T.text }}>{getNavLabel()}</h2>
          {loading && <span style={{ fontSize: 12, color: T.muted }}>⏳ Chargement…</span>}
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 0 }}>
          <div
            style={{
              padding: 12,
              borderRight: `1px solid ${T.border}`,
              background: T.surface2,
              overflow: "auto",
            }}
          >
            <MiniMonth
              T={T}
              S={S}
              currentDate={currentDate}
              selectedDate={view === "day" ? dayDate : null}
              onChangeMonth={handleMiniChangeMonth}
              onPickDay={handlePickDay}
            />

            <div style={{ height: 12 }} />

            <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: T.surface, padding: 12 }}>
              <div style={{ fontWeight: 900, color: T.text, fontSize: 13, marginBottom: 8 }}>Mes calendriers</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
                • Calendrier Optylab <br />
                • Outlook (si connecté)
              </div>
            </div>
          </div>

          <div style={{ minHeight: 0, overflow: "auto", background: T.surface }}>
            {view === "month" && (
              <MonthView
                T={T}
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                events={events}
                today={today}
                onDayClick={(day) => openNewEventModal(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                onEventClick={handleEventClick}
              />
            )}

            {view === "week" && (
              <WeekView
                T={T}
                weekStart={weekStart}
                events={events}
                today={today}
                onSlotClick={(d, h) => openNewEventModal(d, h)}
                onEventClick={handleEventClick}
              />
            )}

            {view === "day" && (
              <DayView
                T={T}
                date={dayDate}
                events={events}
                onSlotClick={(d, h) => openNewEventModal(d, h)}
                onEventClick={handleEventClick}
              />
            )}
          </div>
        </div>

        {showModal && (
          <EventModal
            T={T}
            S={S}
            event={editingEv}
            defaultDate={defaultDate}
            defaultHour={defaultHour}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingEv(null);
              setDefaultDate(null);
            }}
            onDelete={handleDelete}
          />
        )}

        {toast && (
          <div
            style={{
              position: "fixed",
              bottom: 18,
              right: 18,
              background: toast.type === "error" ? "#DC2626" : T.primary,
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 14,
              fontWeight: 900,
              fontSize: 13,
              boxShadow: "0 18px 40px rgba(0,0,0,.18)",
              zIndex: 60,
            }}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlookCalendar;