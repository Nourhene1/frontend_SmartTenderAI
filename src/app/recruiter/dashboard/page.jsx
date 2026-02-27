"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getJobCount,
  getJobsWithCandidatureCount,
} from "../../services/job.api";
import {
  getCondidatureCount,
  getCandidaturesWithJob,
  getMatchingStats, getAcademicStats
} from "../../services/candidature.api";

import CircularStatCard from "../../components/CircularStatCard";
import { GraduationCap } from "lucide-react";

// ✅ Icons modernes
import { Briefcase, Users } from "lucide-react";

// ✅ Chart (Recharts)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ================= UTILS ================= */
function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

/* ================= NAME GUESS (same as candidatures page) ================= */
function guessNameFromFilename(c) {
  const file = safeStr(c?.cv?.originalName || "");
  if (!file) return "";

  const noExt = file.replace(/\.(pdf|docx|doc)$/i, "");

  const cleaned = noExt
    .replace(/^cv[-_ ]?/i, "")
    .replace(/^resume[-_ ]?/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 3) return "";
  if (/^cv\d*$/i.test(cleaned)) return "";

  return cleaned;
}

/* ================= CANDIDATE HELPERS ================= */
function getCandidateObj(c) {
  return c?.extracted?.extracted || c?.extracted || c?.parsed || {};
}

function getFullName(c) {
  const extracted = c?.extracted || {};
  const parsed = c?.parsed || {};

  const full =
    safeStr(c?.fullName) ||
    safeStr(extracted?.manual?.nom) ||
    safeStr(extracted?.nom) ||
    safeStr(parsed?.manual?.nom) ||
    safeStr(parsed?.nom) ||
    safeStr(extracted?.full_name) ||
    safeStr(parsed?.full_name) ||
    safeStr(extracted?.personal_info?.full_name) ||
    safeStr(parsed?.personal_info?.full_name);

  if (full) return full;

  const prenom =
    safeStr(c?.prenom) ||
    safeStr(extracted?.manual?.prenom) ||
    safeStr(extracted?.prenom) ||
    safeStr(parsed?.manual?.prenom) ||
    safeStr(parsed?.prenom) ||
    safeStr(extracted?.first_name) ||
    safeStr(parsed?.first_name);

  const nom =
    safeStr(c?.nom) ||
    safeStr(extracted?.manual?.nom) ||
    safeStr(extracted?.nom) ||
    safeStr(parsed?.manual?.nom) ||
    safeStr(parsed?.nom) ||
    safeStr(extracted?.last_name) ||
    safeStr(parsed?.last_name);

  const constructed = `${prenom} ${nom}`.trim();
  if (constructed) return constructed;

  return guessNameFromFilename(c) || "Candidat";
}

function getInitials(name) {
  const n = safeStr(name);
  if (!n) return "??";
  const parts = n.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

function formatTimeAgo(date) {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${days} j`;
}

/* ================= PAGE ================= */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    jobOffers: 0,
    candidatures: 0,
    matchingStats: null,
  });

  const [lastCandidatures, setLastCandidatures] = useState([]);
  const [loadingLast, setLoadingLast] = useState(true);

  const [matchingStats, setMatchingStats] = useState(null);
  const [loadingMatching, setLoadingMatching] = useState(true);

  // ✅ Chart states
  const [jobsStats, setJobsStats] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [academicStats, setAcademicStats] = useState(null);
  const [loadingAcademic, setLoadingAcademic] = useState(true);
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          jobsRes,
          candRes,
          lastRes,
          chartRes,
          matchingRes,
          academicRes,
          analysisRes
        ] = await Promise.all([
          getJobCount().catch(() => ({ data: { count: 0 } })),
          getCondidatureCount().catch(() => ({ data: { count: 0 } })),
          getCandidaturesWithJob().catch(() => ({ data: [] })),
          getJobsWithCandidatureCount().catch(() => ({ data: [] })),
          getMatchingStats().catch(() => ({
            data: { averageScore: 0, percentAbove80: 0, percentBelow50: 0 }
          })),
          getAcademicStats().catch(() => ({ data: null })),
        ]);

        setStats({
          jobOffers: jobsRes.data.count || 0,
          candidatures: candRes.data.count || 0,
          matchingStats: matchingRes.data || {},
        });

        // dernières candidatures
        const sorted = [...(lastRes.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setLastCandidatures(sorted.slice(0, 3));
        setLoadingLast(false);

        // chart offres
        const chartData = (chartRes.data || [])
          .filter(j => Number(j?.candidaturesCount || 0) > 0)
          .map(j => ({
            name: safeStr(j?.titre)?.slice(0, 14) || "Offre",
            candidatures: Number(j?.candidaturesCount || 0),
          }));
        setJobsStats(chartData);
        setLoadingChart(false);

        setMatchingStats(matchingRes.data || {});
        setLoadingMatching(false);

        // ✅ ACADEMIC STATS (MANQUANT AVANT)
        setAcademicStats(academicRes?.data || null);
        setLoadingAcademic(false);

      } catch (err) {
        console.error("Erreur dashboard générale:", err);

        setLastCandidatures([]);
        setJobsStats([]);
        setMatchingStats({});
        setAcademicStats(null);

        setLoadingLast(false);
        setLoadingChart(false);
        setLoadingMatching(false);
        setLoadingAcademic(false);
      }
    }

    loadDashboard();
  }, []);


  // ✅ Couleurs harmonisées avec le thème vert de l'application
  const degreeColors = {
    "Bac+2": "#86EFAC",    // Vert très clair
    "Bac+3": "#4E8F2F",    // Vert principal
    "Bac+5": "#22C55E",    // Vert clair
    "PhD": "#166534",      // Vert foncé
    "Autre": "#9CA3AF",    // Gris pour autres
  };

  const pieData = (academicStats?.degreeDistribution || []).map(d => ({
    name: d._id || "Autre",
    value: d.total,
  }));

  // ✅ NORMALISATION FRONT (0–1 → 0–100)
  const normalizedMatchingStats = {
    averageScore: Math.round((matchingStats?.averageScore || 0) * 100),
    percentAbove70: matchingStats?.percentAbove70 || 0,
    percentBelow50: matchingStats?.percentBelow50 || 0,
  };

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 px-6 py-14 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* ===== Header ===== */}
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
          Bienvenue dans votre espace RH 👋
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-10">
          Voici un aperçu de vos activités de recrutement.
        </p>

        {/* ===== Stats Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14">
          {/* Offres */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-8 flex items-center gap-6 transition-colors duration-300">
            <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-[#4E8F2F] dark:text-emerald-400" />
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                Offres d'emploi
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {stats.jobOffers}
              </p>
            </div>
          </div>

          {/* Candidatures */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-8 flex items-center gap-6 transition-colors duration-300">
            <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>

            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                Candidatures
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {stats.candidatures}
              </p>
            </div>
          </div>
        </div>

        {/* ===== QUALITÉ MATCHING ===== */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Qualité du matching
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Indicateurs clés sur la pertinence des candidatures
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <CircularStatCard
              title="Score moyen"
              value={normalizedMatchingStats.averageScore}
              color="#4E8F2F"
              subtitle="Moyenne globale"
            />

            <CircularStatCard
              title="Candidats > 70%"
              value={normalizedMatchingStats.percentAbove80}
              color="#22C55E"
              subtitle="Très bons profils"
            />

            <CircularStatCard
              title="Candidats < 50%"
              value={normalizedMatchingStats.percentBelow50}
              color="#EF4444"
              subtitle="Profils à écarter"
            />

          </div>
        </div>

        {/* ===== ANALYSE ACADÉMIQUE ===== */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#4E8F2F]" />
            Analyse académique
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Répartition des niveaux d'études des candidats
          </p>

          {loadingAcademic || !academicStats ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <div className="max-w-lg">
              {/* ===== Pie Chart - Répartition des diplômes ===== */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-8">
                <p className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Répartition des diplômes
                </p>

                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={degreeColors[entry.name] || "#9CA3AF"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        color: "#1F2937",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#1F2937" }}
                      formatter={(value, name) => [`${value} candidats`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>


        {/* ===== Chart ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md p-8 mb-14 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Candidatures par offre
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Répartition des candidatures selon les offres
            </p>
          </div>

          {loadingChart ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chargement du graphique...</p>
          ) : jobsStats.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune donnée disponible.</p>
          ) : (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    stroke="#6B7280"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6B7280" }}
                    stroke="#6B7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      color: "#1F2937",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#1F2937" }}
                  />
                  <Bar
                    dataKey="candidatures"
                    radius={[10, 10, 0, 0]}
                    fill="#000000"
                    className="dark:fill-emerald-500"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ===== Title + Voir tout OUTSIDE table container ===== */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dernières Candidatures
          </h2>

          <Link
            href="/recruiter/candidatures"
            className="text-sm font-semibold text-[#4E8F2F] dark:text-emerald-400 hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {/* ===== TABLE CONTAINER ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md overflow-hidden transition-colors duration-300">
          {loadingLast ? (
            <div className="p-8 text-gray-500 dark:text-gray-400 text-sm">Chargement...</div>
          ) : lastCandidatures.length === 0 ? (
            <div className="p-8 text-gray-500 dark:text-gray-400 text-sm">
              Aucune candidature disponible.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {/* HEADER */}
                <thead className="bg-white dark:bg-gray-800">
                  <tr className="text-gray-400 dark:text-gray-500 uppercase text-xs">
                    <th className="text-left px-10 py-6">Candidat</th>
                    <th className="text-left px-10 py-6">Poste</th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {lastCandidatures.map((c) => {
                    const fullName = getFullName(c);
                    const jobTitle = safeStr(c?.jobTitle) || "—";

                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-green-50/40 dark:hover:bg-gray-700/40 transition"
                      >
                        {/* CANDIDAT */}
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-[#4E8F2F] dark:text-emerald-400 font-bold">
                              {getInitials(fullName)}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {fullName}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {formatTimeAgo(c?.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* POSTE */}
                        <td className="px-10 py-6 text-gray-600 dark:text-gray-300">
                          {jobTitle}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}