// src/components/interviews/RhTechPlanner.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getRhTechSlots, proposeRhTechInterview } from "@/services/calendar.api";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 border border-orange-100 dark:border-orange-500/20">
      {children}
    </span>
  );
}

function Btn({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl px-4 py-3 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed " +
        className
      }
    >
      {children}
    </button>
  );
}

export default function RhTechPlanner({
  candidatureId,
  jobOfferId,
  candidateName = "Candidat",
  onBack,
}) {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState("");

  async function loadSlots() {
    setLoading(true);
    setErr("");
    setSentOk("");
    setSelected(null);
    try {
      const res = await getRhTechSlots({ candidatureId, jobOfferId, days });
      setSlots(res?.data?.slots || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Erreur lors du chargement");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    }
    return Array.from(map.entries());
  }, [slots]);

  async function submit() {
    if (!selected) return;
    setSending(true);
    setErr("");
    setSentOk("");
    try {
      await proposeRhTechInterview({
        candidatureId,
        jobOfferId,
        proposedDate: selected.date,
        proposedTime: selected.time,
      });
      setSentOk("Demande envoyée au responsable métier ✅ (en attente de confirmation)");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Erreur d’envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold text-gray-900 dark:text-white">
            Entretien RH + Technique
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Créneaux communs — Recruteur & Responsable métier ({days} jours)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge>{candidateName}</Badge>
        </div>
      </div>

      {/* Back */}
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
        >
          ← Retour
        </button>
      ) : null}

      {/* Range */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Période:</span>
        {[7, 10, 14].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={
              "px-3 py-1.5 rounded-full text-sm font-semibold border transition " +
              (days === d
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-orange-300")
            }
          >
            {d} jours
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Chargement des créneaux…</div>
        ) : err ? (
          <div className="text-sm text-red-600 dark:text-red-400">{err}</div>
        ) : slots.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Aucun créneau commun trouvé sur la période choisie.
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, list]) => (
              <div key={date} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900 dark:text-white">{date}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{list.length} créneaux</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {list.map((s, idx) => {
                    const active = selected?.date === s.date && selected?.time === s.time;
                    return (
                      <button
                        key={`${s.date}-${s.time}-${idx}`}
                        onClick={() => setSelected({ date: s.date, time: s.time })}
                        className={
                          "px-4 py-2 rounded-2xl text-sm font-semibold border transition " +
                          (active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-800 hover:border-emerald-300")
                        }
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Btn
          onClick={loadSlots}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:border-orange-300"
        >
          Réessayer
        </Btn>

        <Btn
          onClick={submit}
          disabled={!selected || sending}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-95"
        >
          {sending ? "Envoi…" : "Envoyer au Responsable pour confirmation"}
        </Btn>
      </div>

      {sentOk ? (
        <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {sentOk}
        </div>
      ) : null}
    </div>
  );
}