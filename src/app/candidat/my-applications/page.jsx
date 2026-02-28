"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCandidatures } from "../../services/candidature.api";
import { FileText, Clock, CheckCircle2, XCircle, Star, Target, Briefcase } from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    DRAFT:     { label: "Brouillon",   bg: "bg-gray-100 dark:bg-gray-700",    text: "text-gray-600 dark:text-gray-300" },
    SUBMITTED: { label: "Soumise",     bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
    REVIEWED:  { label: "En révision", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
    ACCEPTED:  { label: "Acceptée",   bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    REJECTED:  { label: "Refusée",    bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-600 dark:text-red-400" },
  };
  const s = map[status] || map.SUBMITTED;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {status === "ACCEPTED" && <CheckCircle2 className="w-3 h-3" />}
      {status === "REJECTED" && <XCircle className="w-3 h-3" />}
      {status === "SUBMITTED" && <Clock className="w-3 h-3" />}
      {s.label}
    </span>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-xs text-gray-400">En analyse…</span>;
  const color = score >= 75 ? "text-green-600 dark:text-green-400"
              : score >= 45 ? "text-yellow-600 dark:text-yellow-400"
              :               "text-red-600 dark:text-red-400";
  return (
    <span className={`text-sm font-bold ${color}`}>{score}%</span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyCandidaturesPage() {
  const router = useRouter();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    getMyCandidatures()
      .then((res) => setItems(res?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const preSelected = items.filter((c) => c.preInterview === true).length;
  const submitted   = items.filter((c) => c.status !== "DRAFT").length;
  const avgScore    = items.length
    ? Math.round(items.filter((c) => c.matchScore != null).reduce((a, b) => a + (b.matchScore || 0), 0) / (items.filter((c) => c.matchScore != null).length || 1))
    : null;

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            👋 Bonjour {user?.prenom || user?.nom || ""}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez l&apos;avancement de vos candidatures
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-[#6CB33F]">{submitted}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Candidatures</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-500">{preSelected}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pré-sélections</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-purple-500">{avgScore != null ? `${avgScore}%` : "—"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score moyen</p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune candidature pour le moment</p>
            <button
              onClick={() => router.push("/jobs")}
              className="mt-4 px-6 py-2 bg-[#6CB33F] text-white rounded-xl text-sm font-semibold hover:bg-[#4E8F2F] transition"
            >
              Voir les offres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((c) => {
              const tenderTitre = c.tenderTitre || c.tender?.titre || "Appel d'offres";
              const tenderOrg   = c.tender?.organisation || "";
              const isPreselect = c.preInterview === true;

              return (
                <div key={c._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {tenderTitre}
                        </h3>
                        {isPreselect && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                            <Star className="w-3 h-3" /> Pré-sélectionné
                          </span>
                        )}
                      </div>
                      {tenderOrg && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> {tenderOrg}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Soumise le {formatDate(c.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={c.status} />
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-gray-400" />
                        <ScoreBadge score={c.matchScore} />
                      </div>
                    </div>
                  </div>

                  {/* Matching summary si disponible */}
                  {c.tenderMatch?.summary && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3 line-clamp-2">
                      {c.tenderMatch.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}