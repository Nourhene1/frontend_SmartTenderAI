"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getConfirmInfo,
  confirmInterview,
} from "../../../../services/calendar.api.js"; // ✅ ton calendar.api.js
import {
  CalendarDays,
  Clock,
  MapPin,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

function formatDateFR(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ConfirmInterviewPage() {
  const { confirmToken } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [iv, setIv] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!confirmToken) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMsg("");

        // ✅ GET infos (affichage) — appelle /api/calendar/interview/confirm/:token
        const res = await getConfirmInfo(confirmToken);

        if (!mounted) return;
        setIv(res?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Lien invalide ou expiré.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [confirmToken]);

  const alreadyConfirmed = useMemo(() => {
    const s = String(iv?.status || "").toUpperCase();
    return s === "CONFIRMED";
  }, [iv]);

  async function handleConfirm() {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMsg("");

      // ✅ POST action — appelle /api/calendar/interview/confirm/:token
      const res = await confirmInterview(confirmToken);

      const msg = res?.data?.message || "Entretien confirmé !";
      setSuccessMsg(msg);

      // ✅ Refresh data (pour récupérer status updated)
      try {
        const ref = await getConfirmInfo(confirmToken);
        setIv(ref?.data || null);
      } catch {}
    } catch (e) {
      setError(e?.response?.data?.error || "Impossible de confirmer. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F8] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header (comme email) */}
        <div className="bg-[#2F7D32] px-8 py-8">
          <div className="text-white text-3xl font-extrabold tracking-tight">
            Optylab
          </div>
          <div className="text-white/90 mt-1">Les experts de la vision</div>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#2F7D32] dark:text-emerald-400 leading-tight">
                Invitation à un entretien <br /> RH
              </h1>
              <p className="mt-3 text-gray-700 dark:text-gray-200">
                Bonjour{" "}
                <span className="font-semibold">
                  {iv?.candidateName || "Candidat"}
                </span>
                ,
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || submitting || alreadyConfirmed || !iv}
              className="shrink-0 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold
                         bg-[#2F7D32] text-white hover:opacity-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
              title={alreadyConfirmed ? "Déjà confirmé" : "Confirmer l'entretien"}
            >
              <CheckCircle2 className="w-5 h-5" />
              {alreadyConfirmed
                ? "Confirmé"
                : submitting
                ? "Confirmation..."
                : "Confirmer"}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="mt-6 text-gray-600 dark:text-gray-300">
              Chargement...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-5 py-4 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Success */}
          {!loading && successMsg && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              {successMsg}
            </div>
          )}

          {/* Infos (comme email) */}
          {!loading && iv && !error && (
            <>
              <div className="mt-10">
                <div className="text-gray-500 dark:text-gray-400">Poste</div>
                <div className="text-2xl font-extrabold text-[#2F7D32] dark:text-emerald-400">
                  {iv?.jobTitle || "Poste à définir"}
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-[#E9F4EA] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-6 space-y-4">
                <InfoRow
                  icon={<CalendarDays className="w-5 h-5" />}
                  label="Date"
                  value={formatDateFR(iv?.date || iv?.proposedDate)}
                />
                <InfoRow
                  icon={<Clock className="w-5 h-5" />}
                  label="Heure"
                  value={iv?.time || "10:00"}
                />
                <InfoRow
                  icon={<MapPin className="w-5 h-5" />}
                  label="Lieu"
                  value={iv?.location || "Optylab / Teams"}
                />
                <InfoRow
                  icon={<Briefcase className="w-5 h-5" />}
                  label="Type"
                  value={iv?.typeLabel || "Entretien RH"}
                />
              </div>

              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                En confirmant, le recruteur sera notifié dans l’application et
                par email.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-[#2F7D32] dark:text-emerald-400">{icon}</div>
      <div className="w-20 text-gray-600 dark:text-gray-300">{label}</div>
      <div className="font-bold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}