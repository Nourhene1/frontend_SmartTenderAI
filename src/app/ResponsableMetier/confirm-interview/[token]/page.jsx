"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ResponsableConfirmInterviewPage() {
  const { token } = useParams();
  const router = useRouter();
  const [state, setState] = useState({
    loading: true,
    ok: false,
    message: "",
    error: "",
  });

  useEffect(() => {
    if (!token) return;

    (async () => {
      setState({ loading: true, ok: false, message: "", error: "" });
      try {
        const res = await fetch(`${API_URL}/api/calendar/rh-tech/manager/confirm/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Erreur confirmation");
        }

        setState({
          loading: false,
          ok: true,
          message: data?.message || "Entretien confirmé ✅",
          error: "",
        });
      } catch (e) {
        setState({
          loading: false,
          ok: false,
          message: "",
          error: e?.message || "Erreur",
        });
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F6FFF7] dark:bg-gray-950 px-4 py-10 transition-colors">
      <div className="mx-auto w-full max-w-2xl">
        {/* Card */}
        <div className="overflow-hidden rounded-[32px] border border-emerald-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          {/* Header */}
          <div className="px-8 py-8 bg-[#22a06b] text-white text-center">
            <div className="text-3xl font-extrabold tracking-tight">
              Optylab
            </div>
            <div className="mt-2 text-sm text-white/90">
              Confirmation entretien RH + Technique
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            <button
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            {state.loading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Confirmation en cours…
                </p>
              </div>
            ) : state.ok ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Confirmé ✅
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {state.message}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Le candidat va recevoir un email pour confirmer ou proposer une autre date.
                </p>

                <button
                  onClick={() => router.push("/")}
                  className="mt-6 px-5 py-3 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Erreur
                </h2>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {state.error}
                </p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 px-5 py-3 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}