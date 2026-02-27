"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/* ================= API HELPERS ================= */
async function verifyToken(token) {
  const res = await fetch(`${API_BASE}/users/setup-password/verify?token=${token}`);
  return res.json();
}

async function submitPassword(token, password) {
  const res = await fetch(`${API_BASE}/users/setup-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return res.json();
}

/* ================= PASSWORD STRENGTH ================= */
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Très faible", color: "bg-red-500" };
  if (score === 2) return { score, label: "Faible", color: "bg-orange-400" };
  if (score === 3) return { score, label: "Moyen", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Fort", color: "bg-[#6CB33F]" };
  return { score, label: "Très fort", color: "bg-green-600" };
}

export default function SetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | valid | invalid | success | error
  const [userInfo, setUserInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    verifyToken(token)
      .then((data) => {
        if (data?.valid) {
          setUserInfo(data.user);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const data = await submitPassword(token, password);

      if (data?.message && data.message.toLowerCase().includes("succ")) {
        setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setErrorMsg(data?.message || "Une erreur est survenue.");
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(password);
  const fullName = userInfo ? [userInfo.prenom, userInfo.nom].filter(Boolean).join(" ") : "";

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white dark:bg-gray-900 shadow flex items-center justify-center">
            <Lock className="h-7 w-7 text-[#6CB33F] dark:text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Définir votre mot de passe
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Activez votre compte en choisissant un mot de passe sécurisé.
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          {status === "verifying" && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-[#6CB33F] dark:text-emerald-400" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Vérification du lien...
              </p>
            </div>
          )}

          {status === "invalid" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Lien invalide ou expiré
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Veuillez contacter l’administrateur ou demander un nouveau lien.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#6CB33F] px-4 py-2 text-white font-medium hover:opacity-90 transition"
              >
                Retour connexion
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                Compte activé 🎉
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Votre mot de passe a été défini avec succès. Redirection vers la connexion...
              </p>
            </div>
          )}

          {status === "valid" && (
            <>
              {fullName && (
                <div className="mb-5 rounded-xl bg-[#F0FAF0] dark:bg-gray-800/40 p-3 text-sm text-gray-700 dark:text-gray-200">
                  Bonjour <span className="font-semibold">{fullName}</span>, veuillez choisir votre mot de passe.
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-200 border border-red-100 dark:border-red-900/30">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* PASSWORD */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2.5 pr-12 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6CB33F]"
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label="Afficher/masquer le mot de passe"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="mt-2">
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full ${strength.color}`}
                        style={{ width: `${Math.min(strength.score * 20, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      Force: <span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                </div>

                {/* CONFIRM */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-2.5 pr-12 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#6CB33F]"
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label="Afficher/masquer la confirmation"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#6CB33F] text-white font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Activer mon compte
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}