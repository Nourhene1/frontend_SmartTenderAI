"use client";

import { useRouter } from "next/navigation";

export default function DejaSoumisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-gray-950 p-6 transition-colors duration-300">
      {/* CARD */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-green-100 dark:border-green-900 p-8 sm:p-10 text-center transition-colors duration-300">

        {/* ICON */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center shadow-[0_0_0_8px_rgba(34,197,94,0.2)]">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        </div>

        {/* BADGE */}
        <div className="inline-block mb-5">
          <span className="px-4 py-1.5 text-xs font-semibold tracking-wide bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
            ACCÈS REFUSÉ
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ce quiz a déjà été soumis
        </h1>

        {/* TEXT */}
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg">
          Vous avez déjà complété et soumis ce quiz.
          <br />
          Il n’est pas possible de répondre une deuxième fois.
        </p>

        {/* DIVIDER */}
        <div className="my-8 h-px bg-gray-200 dark:bg-gray-700" />

        {/* BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={() => router.push("/jobs")}
            className="
              px-7 py-3.5 rounded-xl font-semibold text-base
              bg-green-600 hover:bg-green-700
              dark:bg-green-500 dark:hover:bg-green-400
              text-white shadow-md hover:shadow-lg
              transition-all duration-200
            "
          >
            Retour à l’accueil
          </button>
        </div>

        {/* FOOTER */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-10">
          Si vous pensez qu’il s’agit d’une erreur, contactez le recruteur.
        </p>
      </div>
    </div>
  );
}