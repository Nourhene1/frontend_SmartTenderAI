"use client";
// app/candidat/confirm-interview/[token]/CandidatConfirmInterview.jsx

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  XCircle,
  Calendar,
  Clock,
  Briefcase,
  User,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const OPTY = "#4E8F2F";
const OPTY_D = "#3d7524";

export default function CandidatConfirmInterview({ token }) {
  const [status, setStatus] = useState("loading"); // loading | info | confirming | success | error
  const [interview, setInterview] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── 1. Charger les infos
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/calendar/rh-tech/candidate/info/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.message || "Lien invalide ou expiré.");
          setStatus("error");
          return;
        }
        setInterview(data.interview);
        setStatus("info");
      } catch {
        setErrorMsg("Impossible de contacter le serveur.");
        setStatus("error");
      }
    }
    load();
  }, [token]);

  // ── 2. Confirmer
  async function handleConfirm() {
    setStatus("confirming");
    try {
      const res = await fetch(`${API_BASE}/api/calendar/rh-tech/candidate/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setErrorMsg(data.message || "Erreur lors de la confirmation.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  // =========================
  // Loading
  // =========================
  if (status === "loading")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: OPTY }} />
          <p className="text-sm text-gray-500 dark:text-slate-300">
            Chargement de votre entretien.
          </p>
        </div>
      </div>
    );

  // =========================
  // Error
  // =========================
  if (status === "error")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 shadow-2xl">
          <div className="px-6 py-7 text-center bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524]">
            <div className="text-2xl font-extrabold text-white">Optylab</div>
            <div className="text-white/85 text-sm mt-1">Confirmation entretien RH + Technique</div>
          </div>

          <div className="p-7 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-gray-900 dark:text-white">
              Erreur
            </h2>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300 font-bold">
              {errorMsg || "Lien invalide."}
            </p>

            <div className="mt-6 text-xs text-gray-500 dark:text-slate-400">
              Si le problème persiste, demandez un nouveau lien au recruteur.
            </div>
          </div>
        </div>
      </div>
    );

  // =========================
  // Success
  // =========================
  if (status === "success")
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl bg-emerald-500/10" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl bg-emerald-500/10" />

          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-11 h-11" style={{ color: OPTY }} />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              Entretien confirmé ! 🎉
            </h2>

            <p className="text-sm text-gray-500 dark:text-slate-300 mb-1">
              Votre entretien RH+Technique est maintenant confirmé.
            </p>

            {interview && (
              <div className="mt-4 p-4 bg-[#F0FAF0] dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: OPTY }} />
                  <span className="font-semibold text-gray-700 dark:text-slate-200">
                    {interview.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: OPTY }} />
                  <span className="font-semibold text-gray-700 dark:text-slate-200">
                    {interview.time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: OPTY }} />
                  <span className="text-gray-600 dark:text-slate-300">{interview.jobTitle}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-slate-400 mt-4">
              Un email de confirmation vous a été envoyé. À bientôt !
            </p>
          </div>
        </div>
      </div>
    );

  // =========================
  // Info + Confirmer
  // =========================
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0B1220] border border-emerald-100/60 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] px-6 py-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-white/75 text-[11px] font-bold uppercase tracking-wider mb-1">
              Entretien RH + Technique — Confirmation requise
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {interview?.candidateName || "Bonjour !"}
            </h1>
            {interview?.jobTitle && (
              <p className="text-white/80 text-sm mt-1">{interview.jobTitle}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
            Votre entretien RH+Technique a été planifié. Veuillez confirmer votre présence :
          </p>

          {/* Infos entretien */}
          {interview && (
            <div className="space-y-3 p-4 bg-[#F0FAF0] dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4" style={{ color: OPTY }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{interview.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" style={{ color: OPTY }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Heure
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{interview.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4" style={{ color: OPTY }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                    Poste
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">
                    {interview.jobTitle}
                  </p>
                </div>
              </div>

              {interview.recruiterName && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" style={{ color: OPTY }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                      Recruteur
                    </p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      {interview.recruiterName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={status === "confirming"}
            className="w-full py-4 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg"
            style={{
              background: OPTY,
              boxShadow: "0 12px 30px rgba(78,143,47,0.22)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = OPTY_D)}
            onMouseLeave={(e) => (e.currentTarget.style.background = OPTY)}
          >
            {status === "confirming" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Confirmation...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Confirmer ma présence
              </>
            )}
          </button>

          {/* Lien proposer autre date */}
          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-slate-400 mb-2">
              Cette date ne vous convient pas ?
            </p>
            <Link
              href={`/candidat/reschedule-interview/${token}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: OPTY }}
            >
              Proposer une autre date
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}