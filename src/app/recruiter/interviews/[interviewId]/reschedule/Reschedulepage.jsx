"use client";
// app/recruiter/interviews/[id]/reschedule/ReschedulePage.jsx

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, Clock, Briefcase, ArrowLeft } from "lucide-react";
import OutlookCalendar from "../../../../components/Outlookcalendar";
import RescheduleConfirmModal from "../../../../components/Rescheduleconfirmmodal";
import api from "../../../../services/api";

export default function ReschedulePage() {
  const router = useRouter();
  // ✅ Lire l'ID directement depuis l'URL — fiable dans tous les cas Next.js
  const params = useParams();
  const interviewId = params?.interviewId || params?.id;

  const [interview, setInterview] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    console.log("🔍 ReschedulePage mounted, params =", params, "interviewId =", interviewId);
    if (!interviewId) {
      setError("ID de l'entretien manquant dans l'URL");
      setLoading(false);
      return;
    }
    fetchInterview();
  }, [interviewId]);

  async function fetchInterview() {
    setLoading(true);
    setError(null);
    try {
      console.log("📡 Calling GET /api/calendar/interview/" + interviewId);
      const { data } = await api.get(`/api/calendar/interview/${interviewId}`);
      console.log("✅ Response:", data);
      if (data?.interview) {
        setInterview(data.interview);
      } else {
        setError("Entretien introuvable (pas de champ interview dans la réponse)");
      }
    } catch (err) {
      console.error("❌ fetchInterview error:", err?.response?.status, err?.response?.data, err?.message);
      const status = err?.response?.status;
      const msg =
        status === 404 ? "Entretien introuvable (404)" :
        status === 403 ? "Accès refusé (403) — vérifiez que le backend est corrigé" :
        status === 401 ? "Non authentifié (401) — veuillez vous reconnecter" :
        err?.response?.data?.error || err?.message || "Erreur inconnue";
      setError(`Erreur ${status || ""}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  function handleDateSelect(date) {
    const d = date instanceof Date ? date : new Date(date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    console.log("📅 Date selected:", dateStr);
    setSelectedDate(dateStr);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setSelectedDate(null);
  }

  function handleSuccess() {
    setShowModal(false);
    router.push("/recruiter/calendar?rescheduled=1");
  }

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      : "—";

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-[#4E8F2F] border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500">Chargement de l'entretien...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md px-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
            {error}
          </p>
          <p className="text-gray-400 text-xs mb-5">ID: {interviewId || "manquant"}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()}
              className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              Retour
            </button>
            <button onClick={fetchInterview}
              className="px-5 py-2.5 bg-[#4E8F2F] text-white rounded-xl font-semibold text-sm hover:bg-[#3d7524] transition-colors">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Page principale ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative max-w-5xl mx-auto">
          <button onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            Gestion — Report d'entretien
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Choisir un nouveau créneau
          </h1>
          <p className="text-white/75 text-sm mt-2 max-w-xl">
            Le candidat a demandé un report. Cliquez sur une date dans votre calendrier
            pour proposer un nouveau créneau — le candidat pourra seulement{" "}
            <strong className="text-white">confirmer</strong>.
          </p>

          {/* Infos entretien */}
          <div className="mt-6 bg-white/15 backdrop-blur-sm rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {interview?.candidateName?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Candidat</p>
                <p className="text-white font-semibold text-sm">{interview?.candidateName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-white/80" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Poste</p>
                <p className="text-white font-semibold text-sm">{interview?.jobTitle || "—"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-white/80" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Ancienne date</p>
                <p className="text-white font-semibold text-sm capitalize">{formatDate(interview?.proposedDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white/80" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Ancienne heure</p>
                <p className="text-white font-semibold text-sm">{interview?.proposedTime || "—"}</p>
              </div>
            </div>
          </div>

          {/* Raison candidat */}
          {interview?.candidateRescheduleReason && (
            <div className="mt-3 bg-amber-400/20 border border-amber-300/30 rounded-2xl px-5 py-3 flex items-start gap-3">
              <span className="text-lg flex-shrink-0">💬</span>
              <div>
                <p className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-0.5">Raison du candidat</p>
                <p className="text-white text-sm leading-relaxed">{interview.candidateRescheduleReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bannière ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#4E8F2F] text-white rounded-2xl shadow-lg shadow-[#4E8F2F]/25">
          <span className="relative flex-shrink-0 w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
            <span className="relative block w-3 h-3 rounded-full bg-white" />
          </span>
          <p className="text-sm font-bold">
            Cliquez sur une date dans le calendrier pour proposer un nouveau créneau
            {interview?.candidateName ? ` à ${interview.candidateName}` : ""}
          </p>
        </div>
      </div>

      {/* ── Calendrier Outlook ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <OutlookCalendar onDateSelect={handleDateSelect} />
      </div>

      {/* ── Modal ────────────────────────────────────────────────── */}
      {showModal && selectedDate && interview && (
        <RescheduleConfirmModal
          interview={interview}
          selectedDate={selectedDate}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}