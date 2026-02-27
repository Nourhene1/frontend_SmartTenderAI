"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AdminApproveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId;
  const urlAction = params.action; // "approve" ou "reject" depuis l'URL

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [done, setDone] = useState(false);
  const [action, setAction] = useState(null); // null | "approve" | "reject"
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadInterview();
  }, [interviewId]);

  // Si l'admin clique sur le lien "Refuser" dans l'email, ouvrir directement le formulaire de rejet
  useEffect(() => {
    if (urlAction === "reject" && interview && !done) {
      setAction("reject");
    }
  }, [urlAction, interview, done]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      // On charge les détails via l'ID
      const response = await fetch(
        `${API_BASE}/api/interviews/${interviewId}`
      );
      const data = await response.json();

      if (data.success) {
        setInterview(data.data);

        // Vérifier le statut
        if (data.data.status !== "PENDING_ADMIN_APPROVAL") {
          setDone(true);
          if (data.data.status === "PENDING_CONFIRMATION") {
            setSuccessMessage("Cette demande a déjà été traitée.");
          } else {
            setSuccessMessage(
              `Cet entretien est dans le statut : ${data.data.status}`
            );
          }
        }
      } else {
        setErrorMessage("Entretien introuvable");
      }
    } catch (error) {
      console.error("Error loading interview:", error);
      setErrorMessage("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ── Admin approuve ──
  const handleApprove = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `${API_BASE}/api/interviews/admin/approve/${interviewId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();

      if (data.success) {
        setDone(true);
        setSuccessMessage(
          "Modification approuvée ! Le responsable a été notifié pour re-confirmer la date avec le candidat."
        );
      } else {
        setErrorMessage(data.message || "Erreur lors de l'approbation");
      }
    } catch (error) {
      console.error("Error approving:", error);
      setErrorMessage("Erreur lors de l'approbation");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Admin rejette ──
  const handleReject = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `${API_BASE}/api/interviews/admin/reject/${interviewId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await response.json();

      if (data.success) {
        setDone(true);
        setSuccessMessage(
          "Modification refusée. Le responsable a été notifié et devra confirmer la date initiale."
        );
      } else {
        setErrorMessage(data.message || "Erreur lors du rejet");
      }
    } catch (error) {
      console.error("Error rejecting:", error);
      setErrorMessage("Erreur lors du rejet");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ──
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ══════════════════════════════════════════════
  //  LOADING
  // ══════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  NOT FOUND
  // ══════════════════════════════════════════════
  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mb-2">
            Entretien introuvable
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ce lien est peut-être invalide ou l'entretien a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  DONE (déjà traité)
  // ══════════════════════════════════════════════
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6 transition-colors">
            <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Traité !
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* ── Toast Error ── */}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
            <div className="bg-red-500 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 min-w-[320px]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Erreur</p>
                <p className="text-sm opacity-95">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4 transition-colors">
            <ShieldCheck className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            Validation de modification
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors">
            Un responsable demande de modifier la date d'un entretien.
          </p>
        </div>

        {/* ── Détails de l'entretien ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6 transition-colors">
          {/* Candidat info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {interview.candidateName?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                {interview.candidateName || "Candidat"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {interview.candidateEmail}
              </p>
            </div>
          </div>

          {/* Comparaison dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date actuelle */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-5 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                  Date actuelle
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors">
                    {formatDate(interview.proposedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-400" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors">
                    {interview.proposedTime || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nouvelle date demandée */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Nouvelle date demandée
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors">
                    {formatDate(interview.responsableProposedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors">
                    {interview.responsableProposedTime || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flèche centrale */}
          <div className="flex justify-center -mt-2 -mb-2 relative z-10">
            <div className="hidden md:flex w-10 h-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full items-center justify-center transition-colors" style={{ marginTop: "-44px" }}>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Notes du responsable */}
          {interview.responsableModificationNotes && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 transition-colors">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                    Motif du responsable
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors">
                    {interview.responsableModificationNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Responsable info */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>
              Demandé par : <strong>{interview.assignedUserEmail}</strong>
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            Actions : Choix initial ou formulaire rejet
        ══════════════════════════════════════════════ */}

        {!action ? (
          /* ── Boutons d'action ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200 p-6 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  {submitting ? (
                    <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                  ) : (
                    <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                    Approuver
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">
                    Accepter la nouvelle date. Le responsable sera notifié pour
                    relancer le processus.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setAction("reject")}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all duration-200 p-6 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                  <XCircle className="w-7 h-7 text-red-600 dark:text-red-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 transition-colors">
                    Refuser
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">
                    Refuser le changement. Le responsable devra confirmer la date
                    initiale.
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* ── Formulaire de rejet ── */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
            <button
              onClick={() => {
                setAction(null);
                setErrorMessage(null);
              }}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center transition-colors">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                  Refuser la modification
                </h2>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Le responsable sera informé et devra confirmer la date
                  initiale.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 transition-colors">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Raison du refus (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Ex: La date proposée est trop éloignée, merci de confirmer la date initiale..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Confirmer le refus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}