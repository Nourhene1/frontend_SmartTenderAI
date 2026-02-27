"use client";
// app/recruiter/review-interview/[token]/RecruiterReviewCalendar.jsx
//
// Page ouverte depuis l'email du recruteur quand le responsable a proposé
// une nouvelle date. Le recruteur peut :
//   ✅ Accepter → event Outlook créé + email candidat
//   🔁 Proposer autre date → depuis son calendrier → email responsable

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Calendar, Clock, User, Briefcase, XCircle } from "lucide-react";
import OutlookCalendar from "../../../components/Outlookcalendar";
import api from "../../../services/api";

/* ── Modal choix heure après clic sur date ─────────────────────────────── */
function TimePickModal({ open, date, onClose, onSubmit, loading, error, ok }) {
  const [time, setTime] = useState("10:00");

  if (!open) return null;

  const dateFR = date
    ? new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#4E8F2F] to-[#3d7524] text-white">
          <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">
            Contre-proposition
          </p>
          <h2 className="text-white font-extrabold text-xl">Proposer ce créneau</h2>
          {dateFR && <p className="text-white/80 text-sm mt-1 font-semibold capitalize">📅 {dateFR}</p>}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              🕐 Heure de début (durée 1h)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold focus:border-[#4E8F2F] outline-none"
            />
          </div>

          {ok && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-bold text-green-700">Contre-proposition envoyée au responsable ✅</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button onClick={() => onSubmit(time)}
              disabled={!date || !time || loading || ok}
              className="flex-[2] py-3 rounded-xl bg-[#4E8F2F] hover:bg-[#3d7524] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {loading ? "Envoi..." : "Proposer ce créneau"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */
export default function RecruiterReviewCalendar({ token }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const autoAccept   = searchParams.get("action") === "accept";

  const [interview, setInterview]     = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError]     = useState(null);

  // Accept state
  const [accepting, setAccepting]     = useState(false);
  const [acceptOk,  setAcceptOk]      = useState(false);
  const [acceptErr, setAcceptErr]     = useState(null);

  // Propose modal state
  const [clickedDate, setClickedDate] = useState(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [proposing,   setProposing]   = useState(false);
  const [proposeOk,   setProposeOk]   = useState(false);
  const [proposeErr,  setProposeErr]  = useState(null);

  // ── Fetch interview info ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/api/calendar/rh-tech/recruiter/review/${token}`);
        setInterview(data.interview);
      } catch (e) {
        setInfoError(e?.response?.data?.message || "Lien invalide ou expiré");
      } finally {
        setLoadingInfo(false);
      }
    }
    load();
  }, [token]);

  // ── Auto-accept si ?action=accept dans l'URL ──────────────────────────────
  useEffect(() => {
    if (autoAccept && interview && !acceptOk && !accepting) {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAccept, interview]);

  // ── Accepter la date proposée ─────────────────────────────────────────────
  async function handleAccept() {
    setAccepting(true);
    setAcceptErr(null);
    try {
      await api.post(`/api/calendar/rh-tech/recruiter/accept/${token}`);
      setAcceptOk(true);
      setTimeout(() => router.push("/recruiter/calendar?accepted=1"), 3000);
    } catch (e) {
      setAcceptErr(e?.response?.data?.message || "Erreur serveur");
    } finally {
      setAccepting(false);
    }
  }

  // ── Sélection d'une date sur le calendrier ────────────────────────────────
  function handleDateSelect(date) {
    const d = date instanceof Date ? date : new Date(date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setClickedDate(dateStr);
    setProposeOk(false);
    setProposeErr(null);
    setModalOpen(true);
  }

  // ── Soumettre contre-proposition ──────────────────────────────────────────
  async function handlePropose(time) {
    if (!clickedDate || !time) return;
    setProposing(true);
    setProposeErr(null);
    try {
      await api.post(`/api/calendar/rh-tech/recruiter/propose/${token}`, {
        proposedDate: clickedDate,
        proposedTime: time,
      });
      setProposeOk(true);
      setTimeout(() => { setModalOpen(false); router.push("/recruiter/calendar?proposed=1"); }, 2500);
    } catch (e) {
      setProposeErr(e?.response?.data?.message || "Erreur serveur");
    } finally {
      setProposing(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingInfo) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#4E8F2F]" />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (infoError) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500">{infoError}</p>
      </div>
    </div>
  );

  // ── Succès acceptation ────────────────────────────────────────────────────
  if (acceptOk) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Date acceptée ✅</h2>
        <p className="text-sm text-gray-500 mb-1">
          L'événement a été créé dans Outlook.<br/>
          Un email a été envoyé au candidat pour confirmation.
        </p>
        <p className="text-xs text-gray-400">Redirection vers votre calendrier...</p>
      </div>
    </div>
  );

  // ── Page principale ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Header */}
      <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto">
          <p className="text-white/60 text-[11px] font-bold uppercase tracking-wider mb-1">
            Entretien RH + Technique — Action requise
          </p>
          <h1 className="text-2xl font-extrabold text-white mb-1">
            Nouvelle date proposée
          </h1>
          <p className="text-white/70 text-sm">
            Le responsable métier a proposé un nouveau créneau. Acceptez ou proposez une autre date.
          </p>

          {/* Infos entretien */}
          {interview && (
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2">
                <User className="w-4 h-4 text-white/70 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase">Candidat</p>
                  <p className="text-white font-semibold text-sm">{interview.candidateName}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-white/70 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase">Poste</p>
                  <p className="text-white font-semibold text-sm">{interview.jobTitle}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/70 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase">Date proposée</p>
                  <p className="text-white font-semibold text-sm">{interview.date}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/70 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase">Heure</p>
                  <p className="text-white font-semibold text-sm">{interview.time}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* Erreur acceptation */}
        {acceptErr && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700">{acceptErr}</p>
          </div>
        )}

        {/* Deux boutons d'action */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* ✅ Accepter */}
          <button onClick={handleAccept} disabled={accepting || acceptOk}
            className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-[#4E8F2F] hover:bg-[#F0FAF0] dark:hover:bg-[#4E8F2F]/10 transition-all shadow-sm disabled:opacity-50">
            <div className="w-12 h-12 rounded-xl bg-[#4E8F2F] flex items-center justify-center flex-shrink-0">
              {accepting
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <CheckCircle2 className="w-6 h-6 text-white" />
              }
            </div>
            <div className="text-left">
              <p className="font-extrabold text-gray-900 dark:text-white">
                {accepting ? "Acceptation en cours..." : "✅ Accepter cette date"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Crée l'événement Outlook + email au candidat
              </p>
            </div>
          </button>

          {/* 🔁 Proposer autre date */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-gray-900 dark:text-white">🔁 Proposer une autre date</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Cliquez sur une date dans votre calendrier ci-dessous
              </p>
            </div>
          </div>
        </div>

        {/* Bannière calendrier */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#4E8F2F] text-white rounded-2xl shadow-lg">
          <span className="relative flex-shrink-0 w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60" />
            <span className="relative block w-3 h-3 rounded-full bg-white" />
          </span>
          <p className="text-sm font-bold">
            Cliquez sur une date dans votre calendrier pour proposer un autre créneau
          </p>
        </div>
      </div>

      {/* Calendrier Outlook */}
      <div className="max-w-4xl mx-auto">
        <OutlookCalendar onDateSelect={handleDateSelect} />
      </div>

      {/* Modal contre-proposition */}
      <TimePickModal
        open={modalOpen}
        date={clickedDate}
        onClose={() => setModalOpen(false)}
        onSubmit={handlePropose}
        loading={proposing}
        error={proposeErr}
        ok={proposeOk}
      />
    </div>
  );
}