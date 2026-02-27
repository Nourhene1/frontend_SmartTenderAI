"use client";

import { useRouter } from "next/navigation";

export default function MerciPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0FAF0] dark:bg-gray-950 p-6 transition-colors duration-300">
      {/* CARD */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-green-100 dark:border-gray-700 p-8 sm:p-10 text-center transition-colors duration-300">
        {/* SUCCESS ICON */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 dark:bg-emerald-500 flex items-center justify-center shadow-[0_0_0_8px_rgba(34,197,94,0.12)] dark:shadow-[0_0_0_8px_rgba(16,185,129,0.15)]">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* BADGE */}
        <div className="inline-block mb-5">
          <span className="px-4 py-1.5 text-xs font-semibold tracking-wide bg-green-100 dark:bg-emerald-900/40 text-green-700 dark:text-emerald-300 rounded-full">
            SOUMISSION ENREGISTRÉE
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Merci pour votre réponse
        </h1>

        {/* TEXT */}
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg">
          Votre QUIZ TECHNIQUE a été soumis
          <br />
          avec succès.
        </p>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-gray-200 dark:bg-gray-700" />

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* PRIMARY BUTTON */}
          <button
            onClick={() => router.push("/jobs")}
            className="
              px-7 py-3.5 rounded-xl font-semibold text-base
              bg-green-600 hover:bg-green-700 
              dark:bg-emerald-600 dark:hover:bg-emerald-500
              text-white shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            Retour à l'accueil
          </button>
        </div>

        {/* FOOTER NOTE */}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-10">
          Notre équipe examinera votre candidature dans les plus brefs délais.
        </p>
      </div>
    </div>
  );
}