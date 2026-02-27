"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../services/api.js";
import {
  CalendarDays,
  Clock,
  MapPin,
  Briefcase,
  Send,
  AlertTriangle,
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

export default function RescheduleInterviewPage() {
  const { rescheduleToken } = useParams();

  const [loading, setLoading] = useState(true);
  const [iv, setIv] = useState(null);
  const [slots, setSlots] = useState([]);
  const [outlookConnected, setOutlookConnected] = useState(true);

  const [selectedStartISO, setSelectedStartISO] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // ✅ Load interview + slots from backend
  useEffect(() => {
    if (!rescheduleToken) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setDone(false);

        // ✅ GET /api/calendar/interview/reschedule/:token
        const res = await api.get(
          `/api/calendar/interview/reschedule/${rescheduleToken}`
        );

        if (!mounted) return;

        const interview = res?.data?.interview || null;
        const s = res?.data?.slots || [];

        setIv(interview);
        setSlots(s);
        setOutlookConnected(!!res?.data?.outlookConnected);

        // auto-select first slot
        if (s.length > 0) setSelectedStartISO(s[0].startISO);
        else setSelectedStartISO("");
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || "Lien invalide ou expiré.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [rescheduleToken]);

  const canSubmit = useMemo(() => {
    return reason.trim().length >= 3 && !!selectedStartISO && slots.length > 0;
  }, [reason, selectedStartISO, slots]);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError("");

      // ✅ POST /api/calendar/interview/reschedule/:token
      await api.post(`/api/calendar/interview/reschedule/${rescheduleToken}`, {
        reason: reason.trim(),
        selectedStartISO, // ✅ NEW
      });

      setDone(true);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          "Impossible d’envoyer la demande. Réessaie."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F8] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-[#2F7D32] px-8 py-8">
          <div className="text-white text-3xl font-extrabold tracking-tight">
            Optylab
          </div>
          <div className="text-white/90 mt-1">Les experts de la vision</div>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-extrabold text-[#2F7D32] dark:text-emerald-400">
            Proposer une autre date
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Choisissez un créneau disponible (10h–12h){" "}
            <span className="font-semibold">à partir de J+3</span> après votre
            entretien, puis indiquez la raison.
          </p>

          {loading && (
            <div className="mt-6 text-gray-600 dark:text-gray-300">
              Chargement...
            </div>
          )}

          {!loading && error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Infos entretien */}
          {!loading && iv && !error && (
            <div className="mt-6 rounded-2xl bg-[#E9F4EA] dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-6 space-y-4">
              <InfoRow
                icon={<Briefcase className="w-5 h-5" />}
                label="Poste"
                value={iv?.jobTitle || "Poste à définir"}
              />
              <InfoRow
                icon={<CalendarDays className="w-5 h-5" />}
                label="Date"
                value={formatDateFR(iv?.date)}
              />
              <InfoRow
                icon={<Clock className="w-5 h-5" />}
                label="Heure"
                value={iv?.time || "—"}
              />
              <InfoRow
                icon={<MapPin className="w-5 h-5" />}
                label="Lieu"
                value={iv?.location || "Optylab / Teams"}
              />
            </div>
          )}

          {/* Slots */}
          {!loading && !error && (
            <div className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  Créneaux disponibles
                </div>

                {!outlookConnected && (
                  <div className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    Outlook non connecté
                  </div>
                )}
              </div>

              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Sélectionnez un créneau (durée 1h). Les week-ends sont exclus.
              </div>

              {slots.length === 0 ? (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Aucun créneau disponible pour cette période.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {slots.map((s, idx) => {
                    const selected = selectedStartISO === s.startISO;
                    const startTime = s.time; // "10:00" | "11:00"
                    const endTime = startTime === "10:00" ? "11:00" : "12:00";

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedStartISO(s.startISO)}
                        className={`text-left rounded-2xl border px-5 py-4 transition
                          ${
                            selected
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                              : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatDateFR(s.date)}
                            </div>

                            <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                              <span className="font-bold">{startTime}</span>{" "}
                              <span className="text-gray-400">→</span>{" "}
                              <span className="font-bold">{endTime}</span>

                              <span
                                className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs
                                           bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                              >
                                Durée 1h
                              </span>
                            </div>
                          </div>

                          {selected && (
                            <div
                              className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full
                                         bg-emerald-600 text-white dark:bg-emerald-500"
                              aria-label="selected"
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          {!loading && !error && (
            <div className="mt-7">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
                Raison <span className="text-gray-400">(obligatoire)</span>
              </label>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Je serai en déplacement / indisponible à cette date..."
                rows={4}
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 outline-none
                           text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
              />

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold
                           bg-[#2F7D32] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? "Envoi..." : "Envoyer ma demande"}
              </button>
            </div>
          )}

          {done && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Demande envoyée ✅</div>
                  <div className="text-sm mt-1">
                    Le recruteur sera notifié et reviendra vers vous.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!done && !loading && !error && slots.length === 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Aucun créneau disponible</div>
                  <div className="text-sm mt-1">
                    Essayez plus tard ou contactez le recruteur.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[#2F7D32] dark:text-emerald-400">{icon}</div>
      <div className="min-w-24 text-gray-600 dark:text-gray-300">{label}</div>
      <div className="font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  );
}