"use client";
// app/jobs/page.jsx  ← remplace la liste des offres d'emploi par les tenders

import { useEffect, useMemo, useState } from "react";
import { getPublicTenders } from "../services/tender.api";
import Link from "next/link";
import { MapPin, Briefcase, ChevronRight, Search, Zap, Clock } from "lucide-react";

function shortText(t = "", max = 160) {
  const s = t.trim();
  return s.length <= max ? s : s.slice(0, max).trim() + "…";
}

function formatDeadline(d) {
  if (!d) return null;
  // d peut être "31/03/2025" ou une date ISO
  return d;
}

const SECTEUR_COLORS = {
  IT: "#3b82f6", Tech: "#8b5cf6", Finance: "#f59e0b",
  Santé: "#10b981", Industrie: "#6b7280", default: "#6CB33F",
};

export default function PublicTendersPage() {
  const [tenders, setTenders] = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicTenders()
      .then(r => setTenders(r.data || []))
      .catch(() => setTenders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    tenders.filter(t =>
      !search ||
      t.titre?.toLowerCase().includes(search.toLowerCase()) ||
      t.organisation?.toLowerCase().includes(search.toLowerCase()) ||
      t.secteur?.toLowerCase().includes(search.toLowerCase())
    ), [tenders, search]
  );

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            Appels d&apos;offres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Découvrez les opportunités disponibles. Soumettez votre CV pour postuler.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 mb-8 shadow-sm">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
            placeholder="Rechercher (titre, organisation, secteur)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <Briefcase className="mx-auto mb-4 opacity-30" size={48} />
            <p className="font-semibold">
              {search ? "Aucun résultat" : "Aucun appel d'offres disponible"}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((t) => {
            const color = SECTEUR_COLORS[t.secteur] || SECTEUR_COLORS.default;
            return (
              <div key={t._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {t.organisation && (
                      <p className="text-xs font-bold uppercase tracking-wide mb-1"
                        style={{ color }}>
                        {t.organisation}
                      </p>
                    )}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                      {t.titre}
                    </h3>
                  </div>
                 
                </div>

                {/* Description */}
                {t.resume && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {shortText(t.resume)}
                  </p>
                )}

                {/* Keywords */}
                {t.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.keywords.slice(0, 5).map((k, i) => (
                      <span key={i}
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-900">
                        {k}
                      </span>
                    ))}
                    {t.keywords.length > 5 && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        +{t.keywords.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex flex-col gap-1">
                    {t.secteur && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Briefcase size={12} /> {t.secteur}
                      </div>
                    )}
                    {t.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} /> Clôture : {t.deadline}
                      </div>
                    )}
                  </div>

                  <Link href={`/jobs/${t._id}`}>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#6CB33F] hover:bg-[#4E8F2F] text-white transition-colors shadow-sm">
                      Voir détails <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
            {filtered.length} appel{filtered.length > 1 ? "s" : ""} d&apos;offres
          </p>
        )}
      </div>
    </div>
  );
}