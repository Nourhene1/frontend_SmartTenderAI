// ✅ À placer dans : app/candidat/quiz/[quizId]/page.jsx
// (créer le dossier [quizId] dans /candidat/quiz/)

import { Suspense } from "react";
import CandidatQuizClient from "./Candidatquizclient";

export default function CandidatQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Chargement du quiz...</p>
          </div>
        </div>
      }
    >
      <CandidatQuizClient />
    </Suspense>
  );
}