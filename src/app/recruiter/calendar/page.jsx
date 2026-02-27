"use client";
// app/recruiter/calendar/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Quand on arrive depuis "Entretien RH" dans la liste pré-sélection,
// l'URL contient : ?newEvent=1&type=entretien_rh&candidateName=...&candidateEmail=...
// → Le calendrier s'ouvre et le formulaire "Nouvel événement" s'affiche
//   automatiquement pré-rempli avec les infos du candidat.
// Après création → email automatique au candidat (via POST /calendar/events/interview)
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense } from "react";
import OutlookCalendarWithInterview from "../../components/OutlookCalendarWithInterview";

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"/></div>}>
      <OutlookCalendarWithInterview />
    </Suspense>
  );
}
