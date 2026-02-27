"use client";

import { useState } from "react";
import OutlookCalendar from "../Outlookcalendar";
import api from "../../services/api";
import {
  CalendarClock,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

function TimePickModal({ open, date, onClose, onSubmit, loading, error, ok }) {
  const [timeFrom, setTimeFrom] = useState("11:00");
  if (!open) return null;

  const dateFR = date
    ? new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-white dark:bg-gray-900 shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-emerald-100/60 dark:border-gray-800">
        {/* Header (premium) */}
        <div className="relative px-8 py-7 text-white text-center bg-[#22a06b]">
          {/* subtle highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-gradient-to-b from-white/25 to-transparent" />

          <p className="text-white/90 text-[12px] font-extrabold uppercase tracking-[0.18em]">
            RESPONSABLE MÉTIER
          </p>

          <h2 className="mt-1 text-2xl sm:text-[28px] font-extrabold leading-tight">
            Proposer une autre date
          </h2>

          {dateFR && (
            <p className="mt-1 text-white/95 text-sm font-semibold capitalize">
              {dateFR}
            </p>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur flex items-center justify-center transition"
            aria-label="Fermer"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-5">
          {/* Info card */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-[#22a06b] flex items-center justify-center shadow-[0_8px_24px_rgba(34,160,107,0.35)]">
              <CalendarClock className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[18px] font-extrabold text-gray-900 dark:text-white">
                Choisir l&apos;heure
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Choisissez un créneau selon votre agenda Outlook.
              </div>
            </div>
          </div>

          {/* Time field */}
          <div className="space-y-2">
            <label className="block text-[12px] font-extrabold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Heure
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Clock3 className="w-5 h-5" />
              </span>

              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-semibold tracking-wide outline-none
                           focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Astuce : choisissez une heure entre <b>10:00</b> et <b>12:00</b> si possible.
            </p>
          </div>

          {/* Success / Error */}
          {ok ? (
            <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                Nouvelle date envoyée 
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm font-extrabold text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          ) : null}

          {/* CTA */}
          <button
            onClick={() => onSubmit(timeFrom)}
            disabled={!date || !timeFrom || loading || ok}
            className="w-full h-14 rounded-2xl px-6 font-extrabold text-white bg-[#22a06b] hover:bg-[#1b8a5b] transition
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_12px_35px_rgba(34,160,107,0.35)]
                       flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Envoi..." : "Envoyer la nouvelle date"}
          </button>

         
        </div>
      </div>
    </div>
  );
}

export default function ResponsableRescheduleCalendar({ token }) {
  const [clickedDate, setClickedDate] = useState(null);
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  function handleDateSelect(date) {
    const dateStr =
      date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`
        : String(date).split("T")[0];

    setClickedDate(dateStr);
    setOk(false);
    setError("");
    setOpen(true);
  }

  async function submit(time) {
    if (!token || !clickedDate || !time) return;

    setLoading(true);
    setError("");

    try {
      await api.post(`/api/calendar/rh-tech/manager/propose/${token}`, {
        proposedDate: clickedDate,
        proposedTime: time,
      });

      setOk(true);
      window.dispatchEvent(new CustomEvent("calendar:refresh"));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative space-y-6">
      {/* Banner */}
      <div className="px-1">
        <div className="flex items-center gap-3 px-5 py-4 bg-[#22a06b] text-white rounded-2xl shadow-lg">
          <span className="relative flex-shrink-0 w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
            <span className="relative block w-3 h-3 rounded-full bg-white" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-extrabold">
              Cliquez sur une date dans votre calendrier pour proposer un créneau
            </p>
            <p className="text-sm text-white/90 truncate">
              (Selon votre disponibilité Outlook)
            </p>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="w-full" style={{ height: "calc(100vh - 220px)" }}>
        <OutlookCalendar onDateSelect={handleDateSelect} />
      </div>

      <TimePickModal
        open={open}
        date={clickedDate}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        loading={loading}
        error={error}
        ok={ok}
      />
    </div>
  );
}