// src/components/interviews/ScheduleInterviewModal.jsx
"use client";

import ModalShell from "@/components/ui/ModalShell";
import { useState } from "react";
import RhTechPlanner from "@/components/interviews/RhTechPlanner";

export default function ScheduleInterviewModal({
  open,
  onClose,
  candidate,
}) {
  const [step, setStep] = useState("home"); // home | rhtech

  const candidateName = candidate?.name || candidate?.candidateName || "Candidat";
  const candidatureId = candidate?._id || candidate?.candidatureId;
  const jobOfferId = candidate?.jobOfferId || candidate?.jobOffer?._id;

  return (
    <ModalShell
      open={open}
      onClose={() => {
        setStep("home");
        onClose?.();
      }}
      title="Planifier un entretien"
      subtitle={candidateName}
    >
      {step === "home" ? (
        <div className="space-y-4">
          <button
            onClick={() => setStep("rhtech")}
            className="w-full flex items-center gap-4 rounded-3xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 hover:border-orange-300 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center font-black">
              RH
            </div>
            <div className="text-left">
              <div className="font-extrabold text-gray-900 dark:text-white">
                Entretien RH + Technique
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Créneaux communs — Recruteur & Responsable
              </div>
            </div>
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Le responsable métier reçoit un email pour confirmer/modifier la date.
            Après confirmation, le candidat reçoit un email pour confirmer ou proposer une autre date.
          </div>
        </div>
      ) : (
        <RhTechPlanner
          candidatureId={candidatureId}
          jobOfferId={jobOfferId}
          candidateName={candidateName}
          onBack={() => setStep("home")}
        />
      )}
    </ModalShell>
  );
}