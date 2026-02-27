"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewList } from "../../services/candidature.api";
import Link from "next/link";

import {
  UserCheck,
  FileText,
  Search,
  Mail,
  Clock,
  Briefcase,
  Loader2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}
function pct(score) {
  if (typeof score !== "number") return "—";
  const val = score > 1 ? score : score * 100;
  return `${Math.round(val)}%`;
}
function getName(c) {
  const f = safeStr(c?.fullName);
  if (f) return f;
  const b = `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();
  return b || safeStr(c?.email) || "Candidat";
}
function getCvUrl(c) {
  const u = safeStr(c?.cv?.fileUrl);
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}
function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}
function getMatchScore(c) {
  const j = c?.analysis?.jobMatch;
  if (!j) return null;
  const s = j?.score?.score ?? j?.score ?? null;
  if (typeof s !== "number") return null;
  return s > 1 ? s / 100 : s;
}
function scoreBg(s) {
  if (s === null) return "bg-gray-100 text-gray-500";
  if (s >= 0.75) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s >= 0.45) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/* ================================================================
   CARD CANDIDAT
================================================================ */
function PreInterviewCard({ c, index }) {
  const name = getName(c);
  const cvUrl = getCvUrl(c);
  const cvName = getCvName(c);
  const score = getMatchScore(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";
  const email = safeStr(c?.email);
  const selectedAt = c?.preInterview?.selectedAt;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* LEFT */}
          <div className="flex items-start gap-5 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-extrabold text-2xl">
                {name?.[0]?.toUpperCase() || "C"}
              </div>
              <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
            </div>

            {/* Infos */}
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">{name}</h2>

              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{jobTitle}</p>
              </div>

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {email}
                </a>
              )}

              {cvUrl && (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-base font-semibold text-green-700 dark:text-emerald-400 hover:text-green-800"
                >
                  <FileText className="w-5 h-5" />
                  Voir CV <span className="text-gray-400 text-sm font-normal">({cvName})</span>
                </a>
              )}
            </div>
          </div>

          {/* RIGHT (score + date) */}
          <div className="w-full md:w-[260px] shrink-0 flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-4">
            <div className="text-left md:text-right">
              <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Match score</p>
              <div className={`inline-flex text-3xl font-extrabold px-5 py-2 rounded-2xl ${scoreBg(score)}`}>
                {pct(score)}
              </div>
            </div>

            {selectedAt && (
              <div className="inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                Sélectionné le {formatDate(selectedAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   PAGE PRINCIPALE
================================================================ */
export default function PreInterviewListPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getPreInterviewList();
        setCandidates(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        console.error("Erreur chargement pré-entretien:", e?.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const n = getName(c).toLowerCase();
      const e = safeStr(c?.email).toLowerCase();
      const j = safeStr(c?.jobTitle).toLowerCase();
      return n.includes(q) || e.includes(q) || j.includes(q);
    });
  }, [candidates, search]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-500" />
            Candidats Pré-sélectionnés
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {candidates.length} candidat{candidates.length > 1 ? "s" : ""} prêt{candidates.length > 1 ? "s" : ""} pour entretien
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un candidat (nom, email, job)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400 transition-colors"
          />
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {search ? "Aucun candidat trouvé" : "Aucun candidat pré-sélectionné"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c, i) => (
              <PreInterviewCard key={c._id} c={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}