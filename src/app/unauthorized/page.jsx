"use client";

import { useRouter } from "next/navigation";
import { Lock, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  function getCookie(name) {
    const row = document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="));
    if (!row) return null;
    const val = row.split("=").slice(1).join("=");
    if (!val || val === "null" || val === "undefined" || val.trim() === "")
      return null;
    try {
      return decodeURIComponent(val);
    } catch {
      return val;
    }
  }

  const handleGoBack = () => {
    const token = getCookie("token") || localStorage.getItem("token");
    const role = (getCookie("role") || localStorage.getItem("role") || "").toUpperCase();

    if (!token) return router.replace("/login");
    if (role === "ADMIN") return router.replace("/recruiter/dashboard");
    return router.replace("/ResponsableMetier/candidatures");
  };

  const handleLogin = () => router.replace("/login");

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 transition-colors duration-300
                    bg-[#F1FAF4] dark:bg-[#0B1220]">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full
                        bg-[#6CB33F]/20 blur-[70px] dark:bg-[#6CB33F]/15" />
        <div className="absolute -bottom-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full
                        bg-slate-900/10 blur-[70px] dark:bg-slate-900/40" />
      </div>

      <div className="relative w-full max-w-md text-center">

        {/* Card */}
        <div
          className="relative rounded-[22px] px-7 py-8 shadow-[0_25px_80px_rgba(0,0,0,.20)]
                     border border-white/40 dark:border-[#24324A]
                     bg-white/80 dark:bg-[#0F1A2F]/95 backdrop-blur-md"
        >
          {/* Icon bubble */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full
                          bg-[#6CB33F]/15 dark:bg-[#6CB33F]/12">
            <Lock className="h-6 w-6 text-[#4E8F2F] dark:text-[#6CB33F]" />
          </div>

          {/* Badge */}
          <div className="mb-4 flex justify-center">
            <span className="rounded-full px-3 py-1 text-[11px] font-extrabold tracking-[0.22em]
                             text-[#4E8F2F] dark:text-[#A7F3D0]
                             bg-[#6CB33F]/12 dark:bg-[#6CB33F]/10
                             border border-[#6CB33F]/25 dark:border-[#6CB33F]/20">
              ACCÈS REFUSÉ
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[26px] leading-tight font-extrabold text-slate-900 dark:text-slate-100">
            Accès non autorisé
          </h1>

          {/* Text */}
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Vous n’avez pas les permissions nécessaires pour accéder à cette page.
            Veuillez contacter votre administrateur ou vérifier vos identifiants de connexion.
          </p>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full
                         bg-[#6CB33F] hover:bg-[#4E8F2F]
                         text-white font-extrabold text-sm
                         py-3 transition-colors shadow-[0_10px_30px_rgba(108,179,63,.25)]
                         focus:outline-none focus:ring-4 focus:ring-[#6CB33F]/25"
            >
              <Home className="h-4 w-4" />
              Retour à l’accueil
            </button>
          </div>
        </div>

        
      </div>
    </div>
  );
}