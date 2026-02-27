"use client";

import { useSearchParams } from "next/navigation";

export default function CandidatFicheWizardClient() {
  const params = useSearchParams();
  const ficheId = params.get("ficheId");
  const candidatureId = params.get("candidatureId");

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Fiche candidat</h1>
      <p>ficheId: {ficheId}</p>
      <p>candidatureId: {candidatureId}</p>
    </div>
  );
}
