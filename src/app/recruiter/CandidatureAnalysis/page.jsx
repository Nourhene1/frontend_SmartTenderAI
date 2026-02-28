"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Pagination from "../../components/Pagination";
import { getCandidaturesAnalysis, togglePreInterview } from "../../services/candidature.api";
import {
  Search, CheckCircle2, AlertTriangle, Brain, Target,
  BadgeCheck, FileText, ShieldAlert, TrendingUp,
  Check, UserCheck, Building2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ── helpers ─────────────────────────────────────────────── */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}

function pct(score) {
  // score peut être 0-1 (float) ou 0-100 (int matchScore)
  if (typeof score !== "number") return "—";
  const val = score <= 1 ? Math.round(score * 100) : Math.round(score);
  return `${val}%`;
}

function clamp01(n) {
  if (typeof n !== "number") return null;
  // normalise vers 0-1 si c'est déjà 0-100
  const v = n > 1 ? n / 100 : n;
  return Math.max(0, Math.min(1, v));
}

function getCvUrl(c) {
  const fileUrl = safeStr(c?.cv?.fileUrl);
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${API_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}

function getName(c) {
  if (safeStr(c?.fullName)) return safeStr(c.fullName);
  const combined = `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();
  if (combined) return combined;
  const pi = c?.extracted?.parsed?.personal_info || c?.extracted?.personal_info || {};
  const n = pi.full_name || pi.nom || pi.name || "";
  if (n) return n;
  return safeStr(c?.email) || "Candidat";
}

function scorePill(score01) {
  const s = clamp01(score01);
  if (s === null) return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  if (s >= 0.75) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  if (s >= 0.45) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400";
  return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
}

function recColor(rec) {
  const r = safeStr(rec).toLowerCase();
  if (r === "strong_hire" || r === "hire") return "green";
  if (r === "consider") return "yellow";
  if (r === "reject") return "red";
  return "gray";
}

function recLabel(rec) {
  const r = safeStr(rec).toLowerCase();
  if (!r) return "—";
  if (r === "strong_hire") return "Strong Hire";
  if (r === "hire") return "Hire";
  if (r === "consider") return "Consider";
  if (r === "reject") return "Reject";
  return rec;
}

/* ── normalise le nouveau schéma tenderMatch ─────────────── */
function normalizeTenderMatch(tenderMatch) {
  const tm = tenderMatch || {};

  const ds  = tm.detailedScores  || {};
  const sa  = tm.skillsAnalysis  || {};
  const ea  = tm.experienceAnalysis || {};
  const rm  = tm.riskMitigation  || {};
  const ns  = tm.nextSteps       || {};

  // score peut être 0-1 (float) depuis FastAPI
  const rawScore = typeof tm.score === "number" ? tm.score : null;

  return {
    status:    tm.status,
    score:     rawScore,                         // 0-1
    score100:  rawScore != null ? Math.round(rawScore * 100) : null,  // 0-100 pour affichage

    recommendation: tm.recommendation,
    summary:   tm.summary || "",
    strengths: Array.isArray(tm.strengths)  ? tm.strengths  : [],
    weaknesses:Array.isArray(tm.weaknesses) ? tm.weaknesses : [],

    // Scores détaillés
    techFitScore:      ds.skillsFitScore,
    experienceFitScore:ds.experienceFitScore,
    projectFitScore:   ds.projectFitScore,
    educationScore:    ds.educationScore,
    communicationScore:ds.communicationScore,

    // Skills
    matchedSkills:          Array.isArray(sa.matchedHardSkills)      ? sa.matchedHardSkills       : Array.isArray(sa.matchedSkills)       ? sa.matchedSkills       : [],
    matchedSoftSkills:      Array.isArray(sa.matchedSoftSkills)      ? sa.matchedSoftSkills       : [],
    missingMustHaveSkills:  Array.isArray(sa.missingMustHaveSkills)  ? sa.missingMustHaveSkills   : [],
    missingNiceToHaveSkills:Array.isArray(sa.missingNiceToHaveSkills)? sa.missingNiceToHaveSkills : [],
    transferableSkills:     Array.isArray(sa.transferableSkills)     ? sa.transferableSkills      : [],

    // Expérience
    totalYears:    ea.totalYears,
    relevantYears: ea.relevantYears,
    seniorityLevel:ea.seniorityLevel,
    expBreakdown:  Array.isArray(ea.breakdown) ? ea.breakdown : [],

    // Risque
    riskLevel:           rm.riskLevel,
    probabilityOfSuccess:rm.probabilityOfSuccess,
    mitigationStrategies:Array.isArray(rm.mitigationStrategies) ? rm.mitigationStrategies : [],

    // Next steps
    immediateAction: ns.immediateAction,
    talentPoolStatus:ns.talentPoolStatus,
  };
}

/* ── composants ──────────────────────────────────────────── */
function Tag({ children, variant = "gray" }) {
  const styles = {
    green:  "bg-green-50  dark:bg-green-900/30  text-green-700  dark:text-green-400  border-green-200  dark:border-green-800",
    red:    "bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800",
    yellow: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    gray:   "bg-gray-50   dark:bg-gray-700      text-gray-700   dark:text-gray-300   border-gray-200   dark:border-gray-600",
  }[variant] || "";
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${styles}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value01 }) {
  const p = clamp01(value01);
  const pct = p === null ? 0 : Math.round(p * 100);
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className="h-full bg-green-500 dark:bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── CandidatureCard ─────────────────────────────────────── */
function CandidatureCard({ c, onTogglePreselect }) {
  const [toggling, setToggling] = useState(false);

  // ✅ FIX: preInterview est maintenant un boolean, pas un objet
  const isPreselected = c?.preInterview === true;

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      // ✅ FIX: extraire l'id string peu importe le format MongoDB ($oid ou string)
      const rawId = c._id;
      const id = rawId?.$oid ?? rawId?.toString?.() ?? String(rawId);
      await onTogglePreselect(id, isPreselected);
    } finally { setToggling(false); }
  };

  const name = getName(c);

  // ✅ FIX: tenderTitre au lieu de jobTitle
  const tenderTitre = safeStr(c?.tenderTitre) || "—";

  const cvUrl  = getCvUrl(c);
  const cvName = getCvName(c);

  // ✅ FIX: lire tenderMatch au lieu de analysis.jobMatch
  const match = normalizeTenderMatch(c?.tenderMatch);

  // ✅ FIX: lire aiDetection directement, avec isAI au lieu de isAIGenerated
  const ai = c?.aiDetection || {};

  // Expérience display
  const expDisplay = typeof match?.totalYears === "number"
    ? `${match.totalYears} ans`
    : match?.seniorityLevel === "senior" ? "5+ ans"
    : match?.seniorityLevel === "mid"    ? "2-5 ans"
    : match?.seniorityLevel === "junior" ? "0-2 ans"
    : "—";

  // ✅ FIX: matchScore est déjà 0-100, tenderMatch.score est 0-1
  const displayScore = match.score;   // 0-1 pour les couleurs
  const displayPct   = match.score100 ?? (c?.matchScore ?? null); // 0-100 pour affichage

  const skillCloud = useMemo(() => {
    const arr = [
      ...match.matchedSkills,
      ...match.matchedSoftSkills,
      ...match.missingMustHaveSkills,
      ...match.transferableSkills,
    ].map(safeStr).filter(Boolean);
    const seen = new Set();
    return arr.filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 16);
  }, [c]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors duration-300">
      <div className="p-4 md:p-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0 flex items-center justify-center text-green-700 dark:text-emerald-400 font-bold text-sm sm:text-base">
              {name?.[0]?.toUpperCase() || "C"}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white truncate">{name}</h2>

              {/* ✅ tenderTitre + expérience */}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 flex-wrap">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{tenderTitre}</span>
                <span>•</span>
                <span className="font-medium">{expDisplay}</span>
              </p>

              {/* CV link */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {cvUrl ? (
                  <a href={cvUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-green-700 dark:text-emerald-400 hover:underline">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>Voir CV</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs hidden sm:inline">({cvName})</span>
                  </a>
                ) : (
                  <span className="text-xs text-red-500 dark:text-red-400 font-medium">CV manquant</span>
                )}

                {/* Email */}
                {c?.email && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
                    {c.email}
                  </span>
                )}
              </div>

              {/* Risk / proba tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {match?.riskLevel && (
                  <Tag variant={match.riskLevel === "low" ? "green" : match.riskLevel === "high" ? "red" : "yellow"}>
                    Risk: {match.riskLevel}
                  </Tag>
                )}
                {match?.probabilityOfSuccess && (
                  <Tag variant="yellow">Succès: {match.probabilityOfSuccess}</Tag>
                )}
                {match?.seniorityLevel && (
                  <Tag variant="gray">{match.seniorityLevel}</Tag>
                )}
              </div>
            </div>
          </div>

          {/* Bouton pré-sélection */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button onClick={handleToggle} disabled={toggling}
              className={`inline-flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-60 whitespace-nowrap flex-shrink-0 ${
                isPreselected
                  ? "bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 ring-2 ring-green-300 dark:ring-green-700"
                  : "bg-violet-500 dark:bg-violet-600 text-white hover:bg-violet-600"
              }`}>
              {toggling ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isPreselected ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span>{isPreselected ? "Pré-sélectionné" : "Pré-sélectionner"}</span>
            </button>
          </div>
        </div>

        {/* ── 3 métriques ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">

          {/* Match Score */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3 md:p-4 bg-white dark:bg-gray-800/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">TENDER MATCH</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-green-600 dark:text-emerald-400">
                {displayPct != null ? `${displayPct}%` : match?.status === "PENDING" ? "⏳" : match?.status === "PROCESSING" ? "🔄" : "—"}
              </p>
              {match?.recommendation && (
                <span className={`text-xs px-2 py-1 rounded-full ${scorePill(displayScore)}`}>
                  {recLabel(match.recommendation)}
                </span>
              )}
            </div>
            {match?.status && match.status !== "DONE" && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">{match.status}...</p>
            )}
          </div>

          {/* Experience */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3 md:p-4 bg-white dark:bg-gray-800/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">EXPÉRIENCE</p>
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{expDisplay}</p>
              {match?.seniorityLevel && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize flex-shrink-0 ${
                  match.seniorityLevel === "senior" || match.seniorityLevel === "lead"
                    ? "bg-green-100 text-green-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : match.seniorityLevel === "mid"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>{match.seniorityLevel}</span>
              )}
            </div>
            {typeof match?.relevantYears === "number" && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{match.relevantYears} ans</span> pertinents
              </p>
            )}
          </div>

          {/* AI Detection */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-3 md:p-4 bg-white dark:bg-gray-800/50 min-h-[120px] flex flex-col justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">AI DETECTION</p>

            {/* ✅ FIX: ai.status et ai.isAI (nouveau schéma) */}
            {ai?.status !== "DONE" ? (
              <div className="flex items-center gap-2 mt-2">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <p className="text-base sm:text-lg font-bold text-gray-500 dark:text-gray-400 capitalize">
                  {ai?.status || "En attente"}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  {/* ✅ FIX: ai.isAI au lieu de ai.isAIGenerated */}
                  {ai?.isAI ? (
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-emerald-400 flex-shrink-0" />
                  )}
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {ai.isAI ? "IA" : "Humain"}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Confiance:{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {`${Math.round((ai.confidence || 0) * 100)}%`}
                  </span>
                </p>
                {ai?.explanation && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ai.explanation}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Détails ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">

          {/* Colonne gauche */}
          <div className="space-y-4 md:space-y-6">

            {/* Summary + strengths/weaknesses */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm md:text-base">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Résumé IA
              </div>
              <p className="mt-3 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                {match?.summary || "Aucun résumé disponible."}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3 md:mt-4">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Points forts</p>
                  <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {match.strengths.length === 0 ? <li>—</li>
                      : match.strengths.slice(0, 4).map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Points faibles</p>
                  <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {match.weaknesses.length === 0 ? <li>—</li>
                      : match.weaknesses.slice(0, 4).map((x, i) => <li key={i}>• {x}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Expériences détaillées */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm md:text-base">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Détails d&apos;Expérience
              </div>
              <ul className="mt-4 space-y-3 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                {match.expBreakdown.length === 0 ? (
                  <li className="text-gray-400">Aucune expérience détaillée disponible.</li>
                ) : (
                  match.expBreakdown.map((exp, i) => (
                    <li key={i} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {exp.type ? `[${exp.type}] ` : ""}{exp.role || exp.title || "—"}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{exp.company || "—"}</p>
                      <p className="text-gray-400 dark:text-gray-500">{exp.duration || "—"}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Scores détaillés */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-2 text-sm md:text-base">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Scores Détaillés
              </p>
              <div className="space-y-4 mt-4">
                {[
                  ["Skills Fit",      match?.techFitScore],
                  ["Experience Fit",  match?.experienceFitScore],
                  ["Project Fit",     match?.projectFitScore],
                  ["Éducation",       match?.educationScore],
                  ["Communication",   match?.communicationScore],
                ].map(([label, val], i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {typeof val === "number" ? `${Math.round(val * 100)}%` : "—"}
                      </span>
                    </div>
                    <ProgressBar value01={val} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4 md:space-y-6">

            {/* Skill Cloud */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm md:text-base">
                <Brain className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Skill Cloud
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {skillCloud.length === 0 ? <Tag>—</Tag>
                  : skillCloud.map((x, i) => <Tag key={i}>{x}</Tag>)}
              </div>
            </div>

            {/* Job Match Details */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm md:text-base">
                <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Tender Match Details
              </div>
              <div className="mt-4 space-y-4">
                {[
                  ["Compétences matchées",    match.matchedSkills,          "green"],
                  ["Soft skills matchées",    match.matchedSoftSkills,      "green"],
                  ["Manquants (critiques)",   match.missingMustHaveSkills,  "red"],
                  ["Manquants (optionnels)",  match.missingNiceToHaveSkills,"yellow"],
                  ["Compétences transférables",match.transferableSkills,    "yellow"],
                ].map(([label, list, variant], i) => (
                  <div key={i}>
                    <p className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.length === 0
                        ? <Tag variant={variant === "red" ? "green" : "gray"}>
                            {variant === "red" ? "Aucun" : "—"}
                          </Tag>
                        : list.map((x, j) => <Tag key={j} variant={variant}>{x}</Tag>)
                      }
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommandation</p>
                  <Tag variant={recColor(match?.recommendation)}>{recLabel(match?.recommendation)}</Tag>
                </div>
              </div>
            </div>

            {/* Risk & Next Steps */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 md:p-5 bg-white dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-sm md:text-base">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                Risque & Prochaines étapes
              </div>
              <div className="mt-4 space-y-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-semibold">Niveau de risque:</span> {match?.riskLevel || "—"}</p>
                <p><span className="font-semibold">Action immédiate:</span> {match?.immediateAction || "—"}</p>
                <p><span className="font-semibold">Talent Pool:</span> {match?.talentPoolStatus || "—"}</p>
              </div>
              {match.mitigationStrategies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">Stratégies de mitigation</p>
                  <ul className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                    {match.mitigationStrategies.slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────── */
export default function CandidatureAnalysisPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [search,        setSearch]       = useState("");
  const [tenderFilter,  setTenderFilter] = useState("ALL");   // ✅ tender, pas job
  const [aiFilter,      setAiFilter]     = useState("ALL");
  const [minScore,      setMinScore]     = useState(0);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE  = 5;

  // ✅ FIX: preInterview est un boolean
  const preselectedCount = useMemo(
    () => items.filter((c) => c?.preInterview === true).length,
    [items]
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res  = await getCandidaturesAnalysis();
        const data = res?.data;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Load error:", e?.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ✅ FIX: filtres par tenderTitre, tenderMatch, aiDetection.isAI
  const tenders = useMemo(() => {
    const set = new Set();
    items.forEach((c) => { if (c?.tenderTitre) set.add(c.tenderTitre); });
    return ["ALL", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const name  = getName(c).toLowerCase();
      const email = safeStr(c?.email).toLowerCase();
      const titre = safeStr(c?.tenderTitre).toLowerCase();
      const q     = search.trim().toLowerCase();

      if (q && !name.includes(q) && !email.includes(q) && !titre.includes(q)) return false;
      if (tenderFilter !== "ALL" && c?.tenderTitre !== tenderFilter)            return false;

      // ✅ FIX: isAI au lieu de isAIGenerated
      const ai = c?.aiDetection;
      if (aiFilter === "AI"    && ai?.isAI !== true)  return false;
      if (aiFilter === "HUMAN" && ai?.isAI !== false) return false;

      // ✅ FIX: matchScore est 0-100, tenderMatch.score est 0-1
      const score100 = c?.matchScore ??
        (c?.tenderMatch?.score != null ? Math.round(c.tenderMatch.score * 100) : null);
      if (score100 != null && score100 < minScore) return false;

      return true;
    });
  }, [items, search, tenderFilter, aiFilter, minScore]);

  useEffect(() => { setPage(1); }, [search, tenderFilter, aiFilter, minScore]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // ✅ FIX: toggle met à jour preInterview (boolean) + le serveur retourne { message }
  const handleTogglePreselect = useCallback(async (candidatureId, currentValue) => {
    try {
      // ✅ FIX: passer currentValue pour que l'API calcule la bonne valeur
      await togglePreInterview(candidatureId, currentValue);
      setItems((prev) =>
        prev.map((c) => {
          // ✅ FIX: comparer en extrayant l'id correctement
          const cId = c._id?.$oid ?? c._id?.toString?.() ?? String(c._id);
          return cId === candidatureId
            ? { ...c, preInterview: !currentValue }
            : c;
        })
      );
    } catch (err) {
      console.error("Erreur toggle pré-entretien:", err?.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-30 bg-[#F0FAF0]/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Analyse Candidatures
            </h1>
            
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 md:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">

              {/* Search */}
              <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-700">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full outline-none text-xs sm:text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400" />
              </div>

              {/* ✅ Filtre tender (plus job) */}
              <select value={tenderFilter} onChange={(e) => setTenderFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                {tenders.map((t) => (
                  <option key={t} value={t}>{t === "ALL" ? "Tous les tenders" : t}</option>
                ))}
              </select>

              {/* AI filter */}
              <select value={aiFilter} onChange={(e) => setAiFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                <option value="ALL">AI: Tous</option>
                <option value="HUMAN">Humain</option>
                <option value="AI">Généré IA</option>
              </select>

              {/* Score slider */}
              <div className="flex items-center gap-2 md:gap-3 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-700">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Score min</span>
                <input type="range" min={0} max={100} value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-green-600" />
                <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-100 w-8 text-right flex-shrink-0">
                  {minScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-10 pt-4">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune candidature trouvée.</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">
              {filtered.length} candidature{filtered.length > 1 ? "s" : ""}
            </div>
            <div className="space-y-4 md:space-y-6">
              {paginatedItems.map((c) => (
                <CandidatureCard key={c._id} c={c} onTogglePreselect={handleTogglePreselect} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}