"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, MessageSquare, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  candidature,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formData, setFormData] = useState({
    proposedDate: "",
    proposedTime: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && candidature) {
      console.log("📦 Objet candidature complet:", candidature);
      console.log("📦 Clés disponibles:", Object.keys(candidature));
      console.log("📦 candidature.jobOfferId:", candidature.jobOfferId);
      console.log("📦 candidature.jobId:", candidature.jobId);
      console.log("📦 candidature.job:", candidature.job);
    }
    // Reset messages when modal opens
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [isOpen, candidature]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const candidatureId = candidature?._id;

      const jobOfferId =
        candidature?.jobOfferId ||
        candidature?.jobId ||
        candidature?.job?._id ||
        candidature?.analysis?.jobOfferId;

      const errors = [];
      if (!candidatureId) errors.push("ID de la candidature manquant");
      if (!jobOfferId) errors.push("ID de l'offre d'emploi manquant");
      if (!formData.proposedDate) errors.push("Date proposée manquante");
      if (!formData.proposedTime) errors.push("Heure proposée manquante");

      if (errors.length > 0) {
        setErrorMsg(errors.join(" · "));
        setLoading(false);
        return;
      }

      const payload = {
        candidatureId,
        jobOfferId,
        proposedDate: formData.proposedDate,
        proposedTime: formData.proposedTime,
        notes: formData.notes || "",
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg("Entretien planifié avec succès ! Un email a été envoyé au responsable.");
        // Fermer le modal après 2.5s et notifier le parent APRÈS l'affichage
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccessMsg(null);
        }, 2500);
      } else {
        setErrorMsg(data.message || "Erreur serveur inconnue");
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la planification :", error);
      setErrorMsg("Une erreur est survenue lors de la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const today = new Date().toISOString().split("T")[0];

  const candidateName =
    candidature?.extracted?.parsed?.nom ||
    candidature?.extracted?.parsed?.name ||
    candidature?.nom ||
    candidature?.name ||
    "Chargement...";

  const getInitials = (name) => {
    if (!name || name === "Chargement...") return "?";
    const parts = name.split(" ").filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase() || "?";
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3d7524] p-8 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {getInitials(candidateName)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-white/80 text-sm font-medium">Planifier un entretien</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{candidateName}</h2>
              {candidature?.jobTitle && (
                <p className="text-white/70 text-sm mt-1">{candidature.jobTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* ✅ Message de succès */}
          {successMsg && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{successMsg}</p>
            </div>
          )}

          {/* ❌ Message d'erreur */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-red-100 dark:bg-red-800/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 bg-[#F0FAF0] dark:bg-[#4E8F2F]/10 border border-[#4E8F2F]/20 rounded-2xl p-4">
            <div className="h-10 w-10 rounded-xl bg-[#4E8F2F]/10 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-[#4E8F2F]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Notification automatique</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Le responsable métier recevra un email pour confirmer ou modifier cette date.
              </p>
            </div>
          </div>

          {/* Date & Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <div className="h-6 w-6 rounded-lg bg-[#4E8F2F]/10 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-[#4E8F2F]" />
                </div>
                Date
              </label>
              <input type="date" name="proposedDate" value={formData.proposedDate}
                onChange={handleChange} min={today} required
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#4E8F2F]/20 focus:border-[#4E8F2F] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <div className="h-6 w-6 rounded-lg bg-[#4E8F2F]/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-[#4E8F2F]" />
                </div>
                Heure
              </label>
              <input type="time" name="proposedTime" value={formData.proposedTime}
                onChange={handleChange} required
                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#4E8F2F]/20 focus:border-[#4E8F2F] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <div className="h-6 w-6 rounded-lg bg-[#4E8F2F]/10 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-[#4E8F2F]" />
              </div>
              Notes
              <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
              placeholder="Ajoutez des informations complémentaires..."
              className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#4E8F2F]/20 focus:border-[#4E8F2F] resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 outline-none"
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-5 py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-all duration-200"
            >
              Annuler
            </button>
            <button type="submit" disabled={loading || !!successMsg}
              className="flex-1 px-5 py-3.5 bg-[#4E8F2F] hover:bg-[#3d7524] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#4E8F2F]/25 hover:shadow-xl hover:shadow-[#4E8F2F]/30 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Planifié !</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>Planifier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}