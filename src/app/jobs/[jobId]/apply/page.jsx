"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import StepUploadCV from "./steps/StepUploadCV";
import StepManual from "./steps/StepManual";

import { confirmCandidature } from "../../../services/application.api";

export default function ApplyPage() {
  const { jobId } = useParams();

  const [step, setStep] = useState(1);

  const [candidatureId, setCandidatureId] = useState(null);
  const [parsedCV, setParsedCV] = useState(null);
  const [cvFileUrl, setCvFileUrl] = useState(null);

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950 px-6 py-10">
      {/* ===== STEPPER ===== */}
      <div className="flex justify-center gap-6 mb-10">
        <Step label="Upload CV" active={step >= 1} />
        <Step label="Vérification & Complément" active={step >= 2} />
      </div>

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow p-10">
          <StepUploadCV
            jobId={jobId}
            onParsed={(data) => {
              setParsedCV(data.extracted ?? data.parsed);
              setCvFileUrl(data.cvFileUrl);
              setCandidatureId(data.candidatureId);
              setStep(2);
            }}
          />
        </div>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <StepManual
          parsedCV={parsedCV}
          cvFileUrl={cvFileUrl}
          onBack={() => setStep(1)}
          onSubmit={async (manualPayload) => {
            // ✅ FIX: on propage l'erreur pour que StepManual puisse afficher le 409
            const res = await confirmCandidature(candidatureId, parsedCV, manualPayload);

            // Si l'API retourne une erreur (409 doublon, etc.), on la throw
            // pour que le catch dans StepManual l'attrape et affiche le bon message
            if (res && (res.code === "ALREADY_SUBMITTED" || res.code === "EMAIL_ALREADY_APPLIED")) {
              const err = new Error(res.message || "Déjà soumis");
              err.status = 409;
              err.data = res;
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

/* ===== STEPPER ===== */
function Step({ label, active }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center
          ${active 
            ? "bg-green-600 dark:bg-emerald-600 text-white" 
            : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
      >
        ✓
      </div>
      <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}