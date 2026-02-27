"use client";
// components/RescheduleConfirmModal.jsx
// ─────────────────────────────────────────────────────────────────
// Ouvert quand le recruteur clique sur une date dans le calendrier
// pour proposer un nouveau créneau au candidat (reschedule).
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { X, Calendar, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../services/api"; // ✅ axios avec token automatique

export default function RescheduleConfirmModal ({
  interview,       // { _id, candidateName, jobTitle, candidateRescheduleReason, candidatePreferredSlot }
  selectedDate,    // "YYYY-MM-DD"
  onClose,
  onSuccess,
}) {
  const [time, setTime]         = useState("10:00");
  const [loading, setLoading]   = useState(false);
  const [successMsg, setSuccess] = useState(null);
  const [errorMsg, setError]    = useState(null);

  const dateFR = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  async function handleConfirm() {
    if (!time) { setError("Veuillez choisir une heure"); return; }
    setLoading(true);
    setError(null);

    // Build ISO from date + time in local time
    const startISO = new Date(`${selectedDate}T${time}:00`).toISOString();

    try {
      // ✅ api gère le token automatiquement
      const { data } = await api.post(
        `/api/calendar/interview/${interview._id}/propose`,
        { startISO }
      );
      if (data.success) {
        setSuccess("Nouveau créneau envoyé au candidat !");
        setTimeout(() => onSuccess?.(), 2200);
      } else {
        setError(data.error || data.message || "Erreur serveur");
      }
    } catch (e) {
      setError(e?.response?.data?.error || "Impossible de joindre le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative">
            <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
              Proposer un nouveau créneau
            </p>
            <h2 className="text-white font-extrabold text-xl leading-tight">
              {interview?.candidateName || "Candidat"}
            </h2>
            {interview?.jobTitle && (
              <p className="text-white/70 text-sm mt-0.5">{interview.jobTitle}</p>
            )}
            {dateFR && (
              <div className="flex items-center gap-2 mt-3 bg-white/15 rounded-xl px-3 py-2 w-fit">
                <Calendar className="w-4 h-4 text-white/80" />
                <span className="text-white font-semibold text-sm capitalize">{dateFR}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Reason from candidate */}
          {interview?.candidateRescheduleReason && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
                <span className="text-base">💬</span>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                  Raison du candidat
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  {interview.candidateRescheduleReason}
                </p>
              </div>
            </div>
          )}

          {/* Preferred slot from candidate */}
          {interview?.candidatePreferredSlot && (
            <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-3.5">
              <span className="text-base">⭐</span>
              <div>
                <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-0.5">
                  Créneau préféré du candidat
                </p>
                <p className="text-sm text-violet-800 dark:text-violet-300 font-semibold">
                  {new Date(interview.candidatePreferredSlot).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long",
                  })}{" "}
                  à{" "}
                  {new Date(interview.candidatePreferredSlot).toLocaleTimeString("fr-FR", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Time picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <div className="h-6 w-6 rounded-lg bg-[#4E8F2F]/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#4E8F2F]" />
              </div>
              Heure de début <span className="text-gray-400 font-normal text-xs">(durée 1h)</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#4E8F2F]/20 focus:border-[#4E8F2F] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none text-lg font-semibold"
            />
          </div>

          {/* Info email */}
          <div className="flex items-start gap-3 bg-[#F0FAF0] dark:bg-[#4E8F2F]/10 border border-[#4E8F2F]/20 rounded-2xl p-3.5">
            <Send className="w-4 h-4 text-[#4E8F2F] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Le candidat recevra un email avec ce créneau et pourra uniquement <strong>confirmer</strong>.
            </p>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !!successMsg}
              className="flex-[2] py-3 rounded-xl bg-[#4E8F2F] hover:bg-[#3d7524] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#4E8F2F]/25 transition-all disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi...
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Envoyé !
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer au candidat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}