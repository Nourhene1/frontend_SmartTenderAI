"use client";
// components/OutlookCalendarWithInterview.jsx — v4 FINAL
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import OutlookCalendar from "./Outlookcalendar";
import InterviewEventModal from "./InterviewEventModal";

export default function OutlookCalendarWithInterview() {
  const searchParams = useSearchParams();

  const [candidateCtx, setCandidateCtx] = useState(null);
  const [clickedDate,  setClickedDate]  = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [created,      setCreated]      = useState(false);

  // Lire params URL → stocker candidat
  useEffect(() => {
    const name  = searchParams.get("candidateName");
    const email = searchParams.get("candidateEmail");
    const job   = searchParams.get("jobTitle");
    const cid   = searchParams.get("candidatureId");
    const type  = searchParams.get("type");

    if (name || email) {
      setCandidateCtx({
        candidateName:  name  || "",
        candidateEmail: email || "",
        jobTitle:       job   || "",
        candidatureId:  cid   || "",
        type:           type  || "entretien_rh",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Appelé par OutlookCalendar quand une date est cliquée (via prop onDateSelect)
  // Seulement actif quand candidateCtx est présent
  function handleDateSelect(date) {
    const dateStr = date instanceof Date
      ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
      : String(date).split("T")[0];
    setClickedDate(dateStr);
    setShowModal(true);
  }

  function handleClose() {
    setShowModal(false);
    setClickedDate(null);
  }

  function handleCreated() {
    setShowModal(false);
    setClickedDate(null);
    setCandidateCtx(null);
    setCreated(true);
    setTimeout(() => setCreated(false), 6000);
    window.dispatchEvent(new CustomEvent("calendar:refresh"));
  }

  return (
    <div className="relative">

      {/* Bannière violette si candidat en attente */}
      {candidateCtx && !showModal && (
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-2xl shadow-lg">
            <span className="relative flex-shrink-0 w-3 h-3">
              <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-60"/>
              <span className="relative block w-3 h-3 rounded-full bg-white"/>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Cliquez sur une date pour planifier l&apos;entretien</p>
              <p className="text-xs text-violet-200 truncate">
                {candidateCtx.candidateName}
                {candidateCtx.jobTitle ? ` · ${candidateCtx.jobTitle}` : ""}
              </p>
            </div>
            <button onClick={() => setCandidateCtx(null)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* OutlookCalendar — onDateSelect actif seulement si candidat présent */}
      <OutlookCalendar
        onDateSelect={candidateCtx ? handleDateSelect : undefined}
      />

      {/* Modal entretien RH */}
      {showModal && candidateCtx && (
        <InterviewEventModal
          candidateData={candidateCtx}
          selectedDate={clickedDate}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}

      {/* Toast succès */}
      {created && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">Entretien créé dans Outlook !</p>
            <p className="text-xs text-green-100">✉️ Email envoyé au candidat</p>
          </div>
          <button onClick={() => setCreated(false)} className="ml-2 text-green-200 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}