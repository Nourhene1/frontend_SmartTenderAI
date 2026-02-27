"use client";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!totalPages || totalPages <= 1) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => canPrev && onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={`px-4 py-2 rounded-full border text-sm transition-colors
          ${
            canPrev
              ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}
      >
        Précédent
      </button>

      <span className="w-9 h-9 flex items-center justify-center rounded-full border border-[#6CB33F] dark:border-emerald-500 text-[#4E8F2F] dark:text-emerald-400 font-bold bg-white dark:bg-gray-800 transition-colors">
        {currentPage}
      </span>

      <button
        onClick={() => canNext && onPageChange(currentPage + 1)}
        disabled={!canNext}
        className={`px-4 py-2 rounded-full border text-sm transition-colors
          ${
            canNext
              ? "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}
      >
        Suivant
      </button>
    </div>
  );
}