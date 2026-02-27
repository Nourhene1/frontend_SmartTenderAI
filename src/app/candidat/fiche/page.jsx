import { Suspense } from "react";
import CandidatFicheWizardClient from "./CandidatFicheWizardClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <CandidatFicheWizardClient />
    </Suspense>
  );
}
