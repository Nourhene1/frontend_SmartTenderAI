"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  RefreshCw,
  Clock3,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ✅ Optylab green
const OPTY = "#4E8F2F";
const OPTY_D = "#3D7524";

function cn(...a) {
  return a.filter(Boolean).join(" ");
}

/**
 * ✅ Exemple data (remplace par API)
 * slotsByDay = [
 *  { dayLabel: "LUNDI 2 MARS", slots: ["09:00","10:00","11:00","14:00","15:00"] },
 *  ...
 * ]
 */
function fakeFetchSlots(rangeDays) {
  // demo : change légèrement selon rangeDays
  const base = [
    { dayLabel: "LUNDI 2 MARS", slots: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
    { dayLabel: "MARDI 3 MARS", slots: ["10:00", "11:00", "14:00", "15:00"] },
    { dayLabel: "MERCREDI 4 MARS", slots: ["09:00", "10:00", "11:00", "14:00"] },
  ];
  if (rangeDays === 14) {
    base.push({ dayLabel: "JEUDI 5 MARS", slots: ["09:00", "10:00", "11:00"] });
  }
  if (rangeDays === 21) {
    base.push({ dayLabel: "VENDREDI 6 MARS", slots: ["10:00", "11:00", "14:00"] });
    base.push({ dayLabel: "LUNDI 9 MARS", slots: ["09:00", "10:00"] });
  }
  return new Promise((resolve) => setTimeout(() => resolve(base), 600));
}

export default function Page() {
  const { token } = useParams();

  // ✅ Mets ici tes infos réelles (API)
  const [candidateName, setCandidateName] = useState("Yosr Joulek");
  const [jobTitle, setJobTitle] = useState("Développeur Full Stack (JavaScript)");

  // Date actuelle proposée
  const [currentProposed, setCurrentProposed] = useState(
    "vendredi 27 février 2026 à 10:00"
  );

  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [slotsByDay, setSlotsByDay] = useState([]);
  const [selected, setSelected] = useState(null); // { dayLabel, time }
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  async function loadSlots() {
    setLoading(true);
    setErr("");
    setOk(false);
    try {
      // 🔁 Remplace par ton API
      // const res = await fetch(`/api/.../${token}?range=${rangeDays}`)
      // const data = await res.json()
      // setSlotsByDay(data.slotsByDay)

      const data = await fakeFetchSlots(rangeDays);
      setSlotsByDay(data);
    } catch (e) {
      setErr(e?.message || "Erreur chargement créneaux");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays, token]);

  async function submitChoice() {
    if (!selected) return;
    setSending(true);
    setErr("");
    setOk(false);

    try {
      // ✅ Remplace par ton API (POST)
      // await fetch(`/api/.../${token}`, {method:"POST", body: JSON.stringify(selected)})

      await new Promise((r) => setTimeout(r, 800));
      setOk(true);
    } catch (e) {
      setErr(e?.message || "Erreur envoi");
    } finally {
      setSending(false);
    }
  }

  const pills = useMemo(
    () => [
      { label: "7 jours", value: 7 },
      { label: "14 jours", value: 14 },
      { label: "21 jours", value: 21 },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-[#050B14] transition-colors">
      {/* ✅ Width أكبر */}
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header card (vert Optylab) */}
          <div
            className={cn(
              "rounded-[28px] p-8 shadow-xl",
              "bg-gradient-to-br from-[#4E8F2F] via-[#5a9e38] to-[#3D7524]"
            )}
          >
            <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-[0.18em]">
              Proposer une autre date
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {candidateName}
            </h1>
            <p className="mt-2 text-white/90 font-semibold">{jobTitle}</p>
          </div>

          {/* Bloc date actuelle */}
          <div className="mt-7 rounded-2xl border p-5 bg-[#FFF7E6] border-amber-200 shadow-sm dark:bg-[#1A1406] dark:border-amber-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Date actuelle proposée
                </div>
                <div className="mt-0.5 font-extrabold text-gray-900 dark:text-white">
                  {currentProposed}
                </div>
              </div>
            </div>
          </div>

          {/* Range + Refresh */}
          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                Voir sur :
              </span>

              <div className="flex gap-2">
                {pills.map((p) => {
                  const active = p.value === rangeDays;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setRangeDays(p.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-extrabold border transition",
                        active
                          ? "text-white border-transparent"
                          : "bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900"
                      )}
                      style={active ? { background: OPTY } : {}}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={loadSlots}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-extrabold border
                         bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200
                         border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 transition"
              title="Rafraîchir"
            >
              <RefreshCw className={cn("w-4 h-4", loading ? "animate-spin" : "")} />
              Rafraîchir
            </button>
          </div>

          {/* Slots container */}
          <div className="mt-6 rounded-3xl border shadow-xl overflow-hidden bg-white dark:bg-[#0B1220] border-emerald-100 dark:border-slate-800">
            {/* Top message row */}
            <div className="px-6 py-4 bg-[#F6FFF7] dark:bg-[#08101C] border-b border-emerald-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: OPTY }}
                  />
                  <p className="font-extrabold text-gray-900 dark:text-white">
                    Choisissez un créneau disponible
                  </p>
                </div>

                {ok ? (
                  <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Créneau envoyé ✅
                  </div>
                ) : null}

                {err ? (
                  <div className="flex items-center gap-2 text-sm font-extrabold text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    {err}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-slate-300">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: OPTY }} />
                  Chargement des créneaux...
                </div>
              ) : slotsByDay?.length ? (
                <div className="space-y-6">
                  {slotsByDay.map((day) => (
                    <div
                      key={day.dayLabel}
                      className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                    >
                      <div className="px-5 py-4 bg-gray-50 dark:bg-[#08101C] border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" style={{ color: OPTY }} />
                        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                          {day.dayLabel}
                        </div>
                      </div>

                      <div className="p-5 flex flex-wrap gap-3">
                        {day.slots.map((t) => {
                          const active =
                            selected?.dayLabel === day.dayLabel && selected?.time === t;

                          return (
                            <button
                              key={t}
                              onClick={() => {
                                setSelected({ dayLabel: day.dayLabel, time: t });
                                setOk(false);
                                setErr("");
                              }}
                              className={cn(
                                "px-4 py-3 rounded-2xl border font-extrabold text-sm transition",
                                "inline-flex items-center gap-2",
                                active
                                  ? "text-white border-transparent"
                                  : "bg-white dark:bg-[#0B1220] text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900"
                              )}
                              style={active ? { background: OPTY } : {}}
                            >
                              <Clock3 className="w-4 h-4" />
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-gray-500 dark:text-slate-300">
                  Aucun créneau disponible.
                </div>
              )}

              {/* CTA */}
              <div className="mt-7 flex items-center justify-end gap-3 flex-wrap">
                <div className="text-sm font-semibold text-gray-500 dark:text-slate-300">
                  {selected ? (
                    <>
                      Sélection :{" "}
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        {selected.dayLabel} — {selected.time}
                      </span>
                    </>
                  ) : (
                    "Sélectionnez un créneau"
                  )}
                </div>

                <button
                  onClick={submitChoice}
                  disabled={!selected || sending}
                  className={cn(
                    "h-12 px-6 rounded-2xl font-extrabold text-white transition",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "inline-flex items-center justify-center gap-2"
                  )}
                  style={{
                    background: OPTY,
                    boxShadow: "0 12px 30px rgba(78,143,47,0.22)",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.background = OPTY_D;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = OPTY;
                  }}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {sending ? "Envoi..." : "Envoyer le créneau"}
                </button>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}