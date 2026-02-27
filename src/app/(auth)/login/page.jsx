"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login, forgotPassword } from "../../services/auth.api";
import api from "../../services/api";

// ── Register API call (candidat public) ─────────────────
async function registerCandidate({ nom, prenom, email, password }) {
  return api.post("/users/register", { nom, prenom, email, password, role: "CANDIDATE" });
}

// ── SVG Icons ────────────────────────────────────────────
const IconEmail = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0L12 13.5 2.25 6.75" />
  </svg>
);
const IconLock = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75z" />
  </svg>
);
const IconUser = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const IconEye = ({ show }) => show ? (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 4.24A9.96 9.96 0 0112 4c5.52 0 10 4.48 10 8 0 1.35-.52 2.63-1.44 3.73M6.23 6.23C3.6 7.86 2 9.96 2 12c0 3.52 4.48 8 10 8a9.96 9.96 0 004.12-.88" />
  </svg>
) : (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.25 12c0-3.52 4.48-8 10-8s10 4.48 10 8-4.48 8-10 8-10-4.48-10-8z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);
const IconArrowBack = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const IconSpinner = () => (
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ── Input Field ──────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, icon, rightEl, disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full ${icon ? "pl-12" : "pl-4"} ${rightEl ? "pr-12" : "pr-4"} py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#6CB33F] focus:border-[#6CB33F] outline-none transition placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50`}
        />
        {rightEl && (
          <span className="absolute inset-y-0 right-4 flex items-center">{rightEl}</span>
        )}
      </div>
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────
function Alert({ type, msg }) {
  if (!msg) return null;
  const s = type === "error"
    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
    : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400";
  return <div className={`mb-5 border p-3 rounded-lg text-sm ${s}`}>{msg}</div>;
}

// ── Btn ──────────────────────────────────────────────────
function Btn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full bg-[#6CB33F] hover:bg-[#4E8F2F] text-white py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold">
      {loading ? <><IconSpinner />{loadingLabel || "Chargement..."}</> : label}
    </button>
  );
}

// ── TABS ─────────────────────────────────────────────────
const TABS = ["login", "register", "forgot"];

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login"); // login | register | forgot

  // Login
  const [lEmail, setLEmail]       = useState("");
  const [lPass, setLPass]         = useState("");
  const [lShowPass, setLShowPass] = useState(false);
  const [lErr, setLErr]           = useState("");
  const [lLoading, setLLoading]   = useState(false);

  // Register
  const [rNom, setRNom]           = useState("");
  const [rPrenom, setRPrenom]     = useState("");
  const [rEmail, setREmail]       = useState("");
  const [rPass, setRPass]         = useState("");
  const [rShowPass, setRShowPass] = useState(false);
  const [rErr, setRErr]           = useState("");
  const [rOk, setROk]             = useState("");
  const [rLoading, setRLoading]   = useState(false);

  // Forgot
  const [fEmail, setFEmail]       = useState("");
  const [fErr, setFErr]           = useState("");
  const [fOk, setFOk]             = useState("");
  const [fLoading, setFLoading]   = useState(false);

  // ── Panel texts ──────────────────────────────────────
  const panelTexts = {
    login:    { title: "Bienvenue", sub: "Connectez-vous pour accéder à votre espace personnel." },
    register: { title: "Rejoignez-nous", sub: "Créez votre compte candidat et postulez aux appels d'offres." },
    forgot:   { title: "Récupération", sub: "Pas de panique ! Entrez votre email et nous vous enverrons un code." },
  };
  const panel = panelTexts[tab];

  // ── Handlers ────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault(); setLErr(""); setLLoading(true);
    try {
      const res   = await login(lEmail, lPass);
      const token = res?.data?.token;
      const user  = res?.data?.user;
      if (!token || !user) throw new Error("Réponse invalide");

      const role   = String(user?.role || "").trim().toUpperCase();
      const maxAge = 60 * 60 * 24 * 7;

      document.cookie = `token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `role=${encodeURIComponent(role)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, role }));
      window.dispatchEvent(new Event("user-updated"));

      // ✅ Redirection selon le rôle
      if (role === "ADMIN")               router.replace("/recruiter/dashboard");
      else if (role === "RESPONSABLE_METIER") router.replace("/responsable/dashboard");
      else if (role === "CANDIDATE")      router.replace("/candidat/my-applications");
      else                                router.replace("/unauthorized");

      router.refresh();
    } catch (err) {
      setLErr(err?.response?.data?.message || err?.message || "Erreur de connexion.");
    } finally { setLLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault(); setRErr(""); setROk(""); setRLoading(true);
    try {
      await registerCandidate({ nom: rNom, prenom: rPrenom, email: rEmail, password: rPass });
      setROk("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => { setTab("login"); setLEmail(rEmail); }, 1800);
    } catch (err) {
      setRErr(err?.response?.data?.message || "Erreur lors de la création du compte.");
    } finally { setRLoading(false); }
  }

  async function handleForgot(e) {
    e.preventDefault(); setFErr(""); setFOk(""); setFLoading(true);
    try {
      await forgotPassword(fEmail);
      setFOk("Code envoyé à votre email !");
      sessionStorage.setItem("resetEmail", fEmail);
      setTimeout(() => router.push("/verify-code"), 2000);
    } catch (err) {
      if (err?.response?.status === 404) setFErr("Aucun compte associé à cet email.");
      else setFErr(err?.response?.data?.message || "Erreur serveur.");
    } finally { setFLoading(false); }
  }

  const switchTab = (t) => { setTab(t); setLErr(""); setRErr(""); setFErr(""); setROk(""); setFOk(""); };

  return (
    <div className="h-[calc(100vh-80px)] bg-green-50 dark:bg-gray-950 flex items-center justify-center px-4 overflow-hidden transition-colors duration-300">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden relative transition-colors duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">

          {/* ══════════ PANNEAU VERT (gauche) ══════════ */}
          <div className="hidden lg:flex flex-col justify-center px-14 bg-gradient-to-br from-[#6CB33F] to-[#3d7a20] text-white relative overflow-hidden">
            {/* Cercles décoratifs */}
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute top-16 right-8 w-48 h-48 bg-white/8 rounded-full pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

            <div className="relative z-10">
              <Image src="/images/optylab_logo.png" alt="Optylab" width={160} height={55} className="mb-10 brightness-0 invert" />
              <h1 className="text-[38px] font-bold leading-tight mb-4 transition-all duration-500">
                {panel.title}
              </h1>
              <p className="text-[16px] text-white/85 max-w-xs leading-relaxed transition-all duration-500">
                {panel.sub}
              </p>

              {/* Indicateur tab */}
              <div className="flex gap-2 mt-10">
                {["login", "register"].map((t) => (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`w-8 h-1.5 rounded-full transition-all duration-300 ${tab === t ? "bg-white" : "bg-white/30"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ══════════ FORMULAIRES (droite) ══════════ */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">

            {/* Logo mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <Image src="/images/optylab_logo.png" alt="Optylab" width={140} height={50} className="dark:hidden" />
              <Image src="/images/logo_dark.png"    alt="Optylab" width={140} height={50} className="hidden dark:block" />
            </div>

            {/* ── Tabs Login / Register ── */}
            {tab !== "forgot" && (
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 mb-8">
                <button onClick={() => switchTab("login")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "login" ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  Connexion
                </button>
                <button onClick={() => switchTab("register")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "register" ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  Inscription
                </button>
              </div>
            )}

            {/* ════ TAB LOGIN ════ */}
            {tab === "login" && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Connexion</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Accédez à votre espace (recruteur ou candidat)
                </p>
                <Alert type="error" msg={lErr} />
                <form onSubmit={handleLogin} className="space-y-5">
                  <Field label="Email" type="email" value={lEmail} onChange={e => setLEmail(e.target.value)}
                    placeholder="votre@email.com" icon={<IconEmail />} />
                  <Field label="Mot de passe" type={lShowPass ? "text" : "password"}
                    value={lPass} onChange={e => setLPass(e.target.value)}
                    placeholder="••••••••" icon={<IconLock />}
                    rightEl={
                      <button type="button" onClick={() => setLShowPass(v => !v)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <IconEye show={lShowPass} />
                      </button>
                    }
                  />
                  <div className="text-right">
                    <button type="button" onClick={() => switchTab("forgot")}
                      className="text-sm text-[#6CB33F] hover:text-[#4E8F2F] font-medium transition-colors">
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <Btn loading={lLoading} label="Se connecter" loadingLabel="Connexion..." />
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  Pas encore de compte ?{" "}
                  <button onClick={() => switchTab("register")} className="text-[#6CB33F] font-semibold hover:underline">
                    Créer un compte candidat
                  </button>
                </p>
              </>
            )}

            {/* ════ TAB REGISTER ════ */}
            {tab === "register" && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Créer un compte</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Espace réservé aux candidats
                </p>
                <Alert type="error" msg={rErr} />
                <Alert type="success" msg={rOk} />
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prénom" value={rPrenom} onChange={e => setRPrenom(e.target.value)}
                      placeholder="Ali" icon={<IconUser />} />
                    <Field label="Nom" value={rNom} onChange={e => setRNom(e.target.value)}
                      placeholder="Ben Salah" icon={<IconUser />} />
                  </div>
                  <Field label="Email" type="email" value={rEmail} onChange={e => setREmail(e.target.value)}
                    placeholder="votre@email.com" icon={<IconEmail />} />
                  <Field label="Mot de passe" type={rShowPass ? "text" : "password"}
                    value={rPass} onChange={e => setRPass(e.target.value)}
                    placeholder="Min. 8 caractères" icon={<IconLock />}
                    rightEl={
                      <button type="button" onClick={() => setRShowPass(v => !v)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <IconEye show={rShowPass} />
                      </button>
                    }
                  />
                  <Btn loading={rLoading} label="Créer mon compte" loadingLabel="Création..." />
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  Déjà un compte ?{" "}
                  <button onClick={() => switchTab("login")} className="text-[#6CB33F] font-semibold hover:underline">
                    Se connecter
                  </button>
                </p>
              </>
            )}

            {/* ════ TAB FORGOT ════ */}
            {tab === "forgot" && (
              <>
                <button onClick={() => switchTab("login")}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#6CB33F] transition mb-6">
                  <IconArrowBack /> Retour à la connexion
                </button>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Mot de passe oublié</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Entrez votre email pour recevoir un code
                </p>
                <Alert type="error" msg={fErr} />
                <Alert type="success" msg={fOk} />
                <form onSubmit={handleForgot} className="space-y-5">
                  <Field label="Email" type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
                    placeholder="votre@email.com" icon={<IconEmail />} disabled={fLoading || !!fOk} />
                  <Btn loading={fLoading} label="Envoyer le code" loadingLabel="Envoi..." />
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}