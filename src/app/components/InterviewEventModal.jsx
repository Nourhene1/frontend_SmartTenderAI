"use client";


import { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

export default function InterviewEventModal({
  candidateData,
  selectedDate,
  onClose,
  onCreated,
}) {
  const isInterview = !!candidateData;

  const {
    candidateName = "",
    candidateEmail = "",
    jobTitle = "",
    candidatureId = "",
  } = candidateData || {};

  // Titre par défaut
  const defaultTitle = isInterview ? `Entretien RH — ${candidateName}` : "";

  const [title, setTitle] = useState(defaultTitle);

  // Date/heure
  const [date, setDate] = useState(selectedDate || "");
  const [timeFrom, setTimeFrom] = useState("09:30");
  const [timeTo, setTimeTo] = useState("10:30");
  const [allDay, setAllDay] = useState(false);

  // Options
  const [isTeamsMeeting, setIsTeamsMeeting] = useState(true);

  // Participants
  const [participantInput, setParticipantInput] = useState(
    isInterview ? candidateEmail : ""
  );
  const [participants, setParticipants] = useState(
    isInterview && candidateEmail ? [candidateEmail] : []
  );

  // Lieu / description
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Date FR
  const dateFR = useMemo(() => {
    if (!date) return "";
    return new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [date]);

  // Helpers
  function normalizeEmail(v) {
    return (v || "").trim().toLowerCase();
  }
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function addParticipant() {
    const email = normalizeEmail(participantInput);
    if (!email) return;
    if (!isValidEmail(email)) {
      setError("Email participant invalide.");
      return;
    }
    setError("");
    setParticipants((prev) =>
      prev.includes(email) ? prev : [...prev, email]
    );
    setParticipantInput("");
  }

  function removeParticipant(email) {
    setParticipants((prev) => prev.filter((e) => e !== email));
  }

  // Auto-calcul heure fin (+1h) quand on change timeFrom (si pas allDay)
  function handleTimeFromChange(val) {
    setTimeFrom(val);
    if (allDay) return;
    const [h, m] = val.split(":").map(Number);
    const endH = (h + 1) % 24;
    setTimeTo(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }

  // Si allDay => reset heures
  useEffect(() => {
    if (allDay) {
      setTimeFrom("00:00");
      setTimeTo("23:59");
    } else {
      // Remettre une plage "normale" si l'utilisateur désactive
      setTimeFrom((t) => (t === "00:00" ? "09:30" : t));
      setTimeTo((t) => (t === "23:59" ? "10:30" : t));
    }
  }, [allDay]);

  // Submit
  async function handleSubmit({ syncOutlook = false } = {}) {
    if (!date) {
      setError("Date requise.");
      return;
    }
    if (!title.trim()) {
      setError("Titre requis.");
      return;
    }
    if (!allDay && !timeFrom) {
      setError("Heure de début requise.");
      return;
    }

    setSaving(true);
    setError("");

    const start = `${date}T${timeFrom}:00`;
    const end = `${date}T${timeTo}:00`;

    try {
      if (isInterview) {
        // Entretien RH (Outlook + DB + email candidat)
        const r = await api.post("/api/calendar/events/interview", {
          candidatureId,
          candidateName,
          candidateEmail,
          jobTitle,
          start,
          end,
          notes: location || notes || "",
          sendEmailToCandidate: true,
          isTeamsMeeting,
          allDay,
          participants: participants?.length ? participants : undefined,
          syncOutlook,
        });

        // Si email a échoué mais event créé => afficher erreur
        if (!r.data?.emailSent && r.data?.emailError) {
          setError(`Entretien créé mais email non envoyé : ${r.data.emailError}`);
          setSaving(false);
          return;
        }
      } else {
        // Evénement standard
        await api.post("/calendar/events", {
          title: title.trim(),
          start,
          end,
          location: location || null,
          description: notes || null,
          isTeamsMeeting,
          allDay,
          participants: participants?.length ? participants : null,
          syncOutlook,
        });
      }

      onCreated?.();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          "Erreur lors de la création"
      );
    } finally {
      setSaving(false);
    }
  }

  // UI small components
  const Switch = ({ checked, onChange, label }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 select-none"
    >
      <span
        className={[
          "relative inline-flex h-5 w-9 rounded-full transition-colors",
          checked ? "bg-emerald-600" : "bg-gray-200 dark:bg-gray-700",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
    </button>
  );

  const IconBtn = ({ children, onClick, title }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition"
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={(e) => {
          // click outside close
          if (e.target === e.currentTarget) onClose?.();
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
              {isInterview ? "Nouvel entretien" : "Nouvel événement"}
            </h2>

            {/* (Optionnel) petite info */}
            {dateFR && (
              <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                • {dateFR}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Save (haut) */}
            <button
              type="button"
              onClick={() => handleSubmit({ syncOutlook: false })}
              disabled={saving || !date || !title.trim()}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            {/* Close */}
            <IconBtn onClick={onClose} title="Fermer">
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Row: toggles */}
          <div className="flex flex-wrap items-center gap-5">
            <Switch
              checked={isTeamsMeeting}
              onChange={setIsTeamsMeeting}
              label="Réunion Teams"
            />

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 select-none">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-700"
              />
              Journée entière
            </label>
          </div>

          {/* Title big */}
          <div className="mt-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ajoutez un titre"
              className="w-full text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
            />
            <div className="h-[2px] w-full bg-emerald-600 mt-3 rounded-full" />
          </div>

          {/* Grid form */}
          <div className="mt-5 space-y-4">
            {/* Participants */}
            <div className="flex items-start gap-3">
              <div className="mt-3 text-gray-500 dark:text-gray-400">
                {/* people icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addParticipant();
                      }
                    }}
                    placeholder="Invitez des participants (email)"
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={addParticipant}
                    className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Chips */}
                {participants.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {participants.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-xs font-semibold"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => removeParticipant(p)}
                          className="hover:opacity-70"
                          title="Retirer"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M6 18L18 6M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date/time */}
            <div className="flex items-start gap-3">
              <div className="mt-3 text-gray-500 dark:text-gray-400">
                {/* clock icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a10 10 0 100 20 10 10 0 000-20Zm1 11h4v-2h-3V7h-2v6Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    {!allDay && (
                      <input
                        type="time"
                        value={timeFrom}
                        onChange={(e) => handleTimeFromChange(e.target.value)}
                        className="w-[150px] h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    )}
                  </div>

                  <span className="text-gray-500 dark:text-gray-400 text-sm px-1">
                    à
                  </span>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    {!allDay && (
                      <input
                        type="time"
                        value={timeTo}
                        onChange={(e) => setTimeTo(e.target.value)}
                        className="w-[150px] h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    )}
                  </div>
                </div>

                {allDay && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Journée entière activée (00:00 → 23:59)
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="mt-3 text-gray-500 dark:text-gray-400">
                {/* pin icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7Zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Rechercher un lieu"
                className="flex-1 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <div className="mt-3 text-gray-500 dark:text-gray-400">
                {/* list icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h10v2H4v-2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ajoutez une description..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              />
            </div>

            {/* Interview hint */}
            {isInterview && candidateEmail && (
              <div className="mt-1 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                <span className="font-semibold">Candidat :</span>{" "}
                {candidateName || "—"}{" "}
                <span className="text-emerald-700 dark:text-emerald-300">
                  ({candidateEmail})
                </span>
                {jobTitle ? (
                  <>
                    {" "}
                    — <span className="font-semibold">{jobTitle}</span>
                  </>
                ) : null}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/30">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => handleSubmit({ syncOutlook: true })}
            disabled={saving || !date || !title.trim()}
            className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {saving ? "Enregistrement..." : "Enregistrer & sync Outlook"}
          </button>
        </div>
      </div>
    </div>
  );
}