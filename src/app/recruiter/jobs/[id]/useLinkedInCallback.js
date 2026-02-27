"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Linkedin } from "lucide-react";
import { exchangeLinkedInCode } from "../../services/job.api";

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Connexion à LinkedIn en cours...");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code  = urlParams.get("code");
    const state = urlParams.get("state") || "";
    const error = urlParams.get("error");

    console.log("🔵 [CALLBACK] Monté, code:", code ? code.slice(0,15)+"..." : "ABSENT");

    if (error) {
      setStatus("error");
      setMessage(`Erreur LinkedIn : ${error}`);
      setTimeout(() => router.replace("/recruiter/jobs"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Code OAuth manquant.");
      setTimeout(() => router.replace("/recruiter/jobs"), 3000);
      return;
    }

    // ✅ FIX STRICT MODE: utiliser sessionStorage pour éviter double exécution
    // useRef ne fonctionne pas car StrictMode démonte/remonte et recrée le ref
    const alreadyProcessed = sessionStorage.getItem("li_code_processing");
    if (alreadyProcessed === code) {
      console.log("⚠️ [CALLBACK] Code déjà en cours de traitement → ignoré (StrictMode)");
      return;
    }
    sessionStorage.setItem("li_code_processing", code);

    console.log("🟡 [CALLBACK] Envoi unique du code au backend...");

    (async () => {
      try {
        const res = await exchangeLinkedInCode(code, state);
        console.log("🟢 [CALLBACK] Succès:", res.data);

        // Nettoyer le flag
        sessionStorage.removeItem("li_code_processing");

        const { returnJobId } = res.data;
        setStatus("success");
        setMessage("LinkedIn connecté avec succès !");

        setTimeout(() => {
          if (returnJobId) {
            router.replace(`/recruiter/jobs/${returnJobId}?linkedin=connected`);
          } else {
            router.replace("/recruiter/jobs?linkedin=connected");
          }
        }, 1500);

      } catch (err) {
        console.error("❌ [CALLBACK] Erreur:", err?.response?.data || err?.message);
        sessionStorage.removeItem("li_code_processing");
        setStatus("error");
        setMessage(err?.response?.data?.message || "Erreur de connexion LinkedIn.");
        setTimeout(() => router.replace("/recruiter/jobs"), 3000);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-2xl p-10 max-w-md w-full text-center">

        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-[#0A66C2]/10 dark:bg-[#0A66C2]/20 grid place-items-center">
          <Linkedin size={40} className="text-[#0A66C2]" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin text-[#0A66C2] mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Connexion LinkedIn</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">LinkedIn connecté ! ✅</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Redirection en cours...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Erreur de connexion</h2>
            <p className="mt-2 text-sm text-red-500">{message}</p>
            <p className="mt-1 text-xs text-gray-400">Redirection dans 3 secondes...</p>
          </>
        )}
      </div>
    </div>
  );
}