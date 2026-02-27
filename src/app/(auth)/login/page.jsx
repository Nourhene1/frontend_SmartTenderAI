"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login, forgotPassword } from "../../services/auth.api";

export default function LoginPage() {
  const router = useRouter();

  // États pour le formulaire de login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // États pour le formulaire de mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // État pour contrôler le slide
  const [isSlided, setIsSlided] = useState(false);

  // Handler pour le login
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user)
        throw new Error("Réponse login invalide (token/user manquant)");

      const role = String(user?.role || "")
        .trim()
        .toUpperCase();
      const maxAge = 60 * 60 * 24 * 7;

      // ✅ cookie (باش middleware يقرى)
      document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${encodeURIComponent(role)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

      // ✅ localStorage (للـ UI)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, role }));
      window.dispatchEvent(new Event("user-updated"));

      // ✅ navigation الصحيح
      if (role === "ADMIN") {
        router.replace("/recruiter/dashboard");
      } else {
        router.replace("/ResponsableMetier/candidatures");
      }
      router.refresh();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Erreur de connexion.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      const res = await forgotPassword(forgotEmail);

      if (res.status === 200) {
        setForgotSuccess(true);
        sessionStorage.setItem("resetEmail", forgotEmail);
        setTimeout(() => {
          router.push("/verify-code");
        }, 2000);
      }
    } catch (err) {
      // ✅ Gérer l'erreur 404 (email non trouvé)
      if (err?.response?.status === 404) {
        setForgotError("Aucun compte n'est associé à cet email");
      } else if (err?.response?.data?.message) {
        setForgotError(err.response.data.message);
      } else {
        setForgotError("Erreur de connexion au serveur");
      }
    } finally {
      setForgotLoading(false);
    }
  }
  // Fonction pour basculer vers mot de passe oublié
  const handleForgotClick = () => {
    setIsSlided(true);
    setError("");
    setForgotError("");
    setForgotSuccess(false);
  };

  // Fonction pour revenir au login
  const handleBackToLogin = () => {
    setIsSlided(false);
    setForgotError("");
    setForgotSuccess(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-green-50 dark:bg-gray-950 flex items-center justify-center px-4 overflow-hidden transition-colors duration-300">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden relative transition-colors duration-300">
        {/* Container principal avec les deux formulaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* ================= FORMULAIRE LOGIN (DROITE) ================= */}
          <div
            className={`p-10 lg:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out ${
              isSlided
                ? "lg:translate-x-full opacity-0 pointer-events-none"
                : "translate-x-0 opacity-100"
            } order-2 lg:order-2`}
          >
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/optylab_logo.png"
                alt="Optylab"
                width={180}
                height={70}
                priority
                className="dark:hidden"
              />
              <Image
                src="/images/logo_dark.png"
                alt="Optylab"
                width={180}
                height={70}
                priority
                className="hidden dark:block"
              />
            </div>

            <h2 className="text-[28px] font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
              Connexion Recruteur
            </h2>

            <p className="text-[14.5px] text-gray-500 dark:text-gray-400 text-center mb-8">
              Accès réservé à l&apos;équipe RH d&apos;Optylab
            </p>

            {error && (
              <div className="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                  Email professionnel
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0L12 13.5 2.25 6.75"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="votre.email@optylab.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75z"
                      />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    placeholder="********"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 4.24A9.96 9.96 0 0112 4c5.52 0 10 4.48 10 8 0 1.35-.52 2.63-1.44 3.73M6.23 6.23C3.6 7.86 2 9.96 2 12c0 3.52 4.48 8 10 8a9.96 9.96 0 004.12-.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 12c0-3.52 4.48-8 10-8s10 4.48 10 8-4.48 8-10 8-10-4.48-10-8z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-sm text-[#6CB33F] dark:text-emerald-400 hover:text-[#4E8F2F] dark:hover:text-emerald-300 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6CB33F] dark:bg-emerald-600 hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 text-white py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>

          {/* ================= FORMULAIRE MOT DE PASSE OUBLIÉ (GAUCHE) ================= */}
          <div
            className={`p-10 lg:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out absolute lg:relative inset-0 bg-white dark:bg-gray-800 ${
              isSlided
                ? "translate-x-0 opacity-100"
                : "lg:-translate-x-full opacity-0 pointer-events-none"
            } order-1 lg:order-1`}
          >
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/optylab_logo.png"
                alt="Optylab"
                width={180}
                height={70}
                priority
                className="dark:hidden"
              />
              <Image
                src="/images/logo_dark.png"
                alt="Optylab"
                width={180}
                height={70}
                priority
                className="hidden dark:block"
              />
            </div>

            <h2 className="text-[28px] font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
              Mot de passe oublié ?
            </h2>

            <p className="text-[14.5px] text-gray-500 dark:text-gray-400 text-center mb-8">
              Entrez votre email pour recevoir un code de réinitialisation
            </p>

            {/* Message de succès */}
            {forgotSuccess && (
              <div className="mb-5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm text-center">
                <p>Un code a été envoyé à votre adresse email !</p>
                <p className="text-xs mt-1">Redirection en cours...</p>
              </div>
            )}

            {/* Message d'erreur */}
            {forgotError && (
              <div className="mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">
                  Email professionnel
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0L12 13.5 2.25 6.75"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="votre.email@optylab.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading || forgotSuccess}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#6CB33F] dark:focus:ring-emerald-500 focus:border-[#6CB33F] dark:focus:border-emerald-500 outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading || forgotSuccess}
                className="w-full bg-[#6CB33F] dark:bg-emerald-600 hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 text-white py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Envoi en cours...
                  </>
                ) : forgotSuccess ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Redirection...
                  </>
                ) : (
                  "Envoyer le code"
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#6CB33F] dark:hover:text-emerald-400 transition-colors py-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                Retour à la connexion
              </button>
            </form>
          </div>
        </div>

        {/* ================= PANNEAU VERT ANIMÉ ================= */}
        <div
          className={`hidden lg:flex absolute top-0 h-full w-1/2 bg-gradient-to-br from-[#6CB33F] to-[#4E8F2F] text-white transition-all duration-700 ease-in-out overflow-hidden ${
            isSlided ? "left-1/2" : "left-0"
          }`}
        >
          <div className="relative flex flex-col justify-center px-14 w-full">
            <h1
              className={`text-[44px] font-semibold mb-6 transition-all duration-500 delay-200 ${
                isSlided
                  ? "translate-x-0 opacity-100"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {isSlided ? "Récupération" : "Bienvenue"}
            </h1>

            <p
              className={`text-[18px] text-white/90 max-w-md transition-all duration-500 delay-300 ${
                isSlided
                  ? "translate-x-0 opacity-100"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {isSlided
                ? "Pas de panique ! Entrez votre email et nous vous enverrons un code pour réinitialiser votre mot de passe."
                : "Plateforme RH intelligente dédiée à l'équipe de recrutement d'Optylab."}
            </p>

            {/* Cercles décoratifs */}
            <div
              className={`absolute -bottom-24 -left-24 w-80 h-80 bg-white/15 rounded-full pointer-events-none transition-all duration-700 ${
                isSlided ? "scale-110" : "scale-100"
              }`}
            />
            <div
              className={`absolute top-16 right-16 w-48 h-48 bg-white/10 rounded-full pointer-events-none transition-all duration-700 ${
                isSlided ? "scale-90 -translate-y-4" : "scale-100 translate-y-0"
              }`}
            />

            {/* Cercle supplémentaire pour l'animation */}
            <div
              className={`absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none transition-all duration-700 ${
                isSlided ? "scale-150 opacity-100" : "scale-0 opacity-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
