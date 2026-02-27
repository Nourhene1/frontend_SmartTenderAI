// src/components/ui/ModalShell.jsx
"use client";

export default function ModalShell({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[32px] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* header gradient */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/20 transition flex items-center justify-center"
            aria-label="Fermer"
          >
            ✕
          </button>

          <div className="text-2xl font-extrabold leading-tight">{title}</div>
          {subtitle ? <div className="mt-1 text-white/90 text-sm">{subtitle}</div> : null}
        </div>

        {/* body */}
        <div className="px-8 py-6 overflow-auto">{children}</div>
      </div>
    </div>
  );
}