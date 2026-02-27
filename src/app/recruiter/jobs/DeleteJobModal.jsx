"use client";

export default function DeleteJobModal({ open, onClose, onConfirm, job }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden transition-colors duration-300">
        {/* ===== Header ===== */}
        <div className="px-10 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Supprimer l&apos;offre
              </h2>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">
                Cette action est irréversible
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full grid place-items-center
                         text-gray-500 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-white 
                         hover:bg-gray-100 dark:hover:bg-gray-700 
                         transition-colors"
              aria-label="Fermer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* ===== Body ===== */}
        <div className="px-10 py-8">
          <div className="flex flex-col gap-6">

            {/* Ligne icône + texte */}
            <div className="flex items-start gap-6">
              {/* Warning icon */}
              <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/30 grid place-items-center shrink-0">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-red-600 dark:text-red-400"
                >
                  <path
                    d="M12 9V13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Texte */}
              <div>
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Êtes-vous sûr de vouloir supprimer cette offre ?
                </p>
                <p className="text-gray-900 dark:text-white font-extrabold text-xl mt-2">
                  {job?.titre}
                </p>
              </div>
            </div>

            {/* Boutons en dessous */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-12 px-8 rounded-full 
                           border border-gray-200 dark:border-gray-600
                           text-gray-800 dark:text-gray-200 font-semibold
                           hover:bg-gray-50 dark:hover:bg-gray-700 
                           transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                data-cy="confirm-delete"
                onClick={onConfirm}
                className="h-12 px-8 rounded-full
                           bg-red-500 hover:bg-red-600
                           dark:bg-red-600 dark:hover:bg-red-500
                           text-white font-semibold
                           shadow-md shadow-red-500/30 dark:shadow-red-600/30 
                           transition-colors"
              >
                Supprimer
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}