"use client";
// app/jobs/[jobId]/page.jsx ← détail d'un tender (remplace job detail)

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPublicTenderById } from "../../services/tender.api";
import {
  ArrowLeft, Send, Clock, Building2,
  Tag, CheckCircle2, Briefcase, ChevronRight,
} from "lucide-react";

function Tag_({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${className}`}>
      {children}
    </span>
  );
}

export default function TenderDetailPage() {
  const { jobId } = useParams();           // ← même param qu'avant
  const [tender,  setTender]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!jobId) return;
    getPublicTenderById(jobId)
      .then(r  => setTender(r.data || null))
      .catch(e => setError(e?.response?.data?.message || "Offre introuvable."))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error || !tender) return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-red-500">{error || "Appel d'offres introuvable."}</p>
    </div>
  );

  const reqs = tender.requirements || {};
  const allReqs = [
    ...(reqs.technical  || []),
    ...(reqs.functional || []),
    ...(reqs.experience || []),
  ];

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Back */}
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline mb-8">
          <ArrowLeft size={15} /> Retour aux offres
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">

          {/* Header */}
          {tender.organisation && (
            <p className="text-xs font-bold uppercase tracking-wide text-[#6CB33F] mb-1">
              {tender.organisation}
            </p>
          )}
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            {tender.titre}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tender.secteur && (
              <Tag_ className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                <Briefcase size={11} className="mr-1" /> {tender.secteur}
              </Tag_>
            )}
            
            {tender.deadline && (
              <Tag_ className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
                <Clock size={11} className="mr-1" /> Clôture : {tender.deadline}
              </Tag_>
            )}
            
          </div>

          {/* Résumé */}
          {tender.resume && (
            <div className="mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-3">
                Description
              </h3>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                {tender.resume}
              </p>
            </div>
          )}

          {/* Keywords */}
          {tender.keywords?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-3">
                Mots-clés
              </h3>
              <div className="flex flex-wrap gap-2">
                {tender.keywords.map((k, i) => (
                  <span key={i}
                    className="bg-[#E9F5E3] dark:bg-emerald-950/40 text-[#4E8F2F] dark:text-emerald-300 text-xs font-medium px-3 py-1 rounded-full border border-green-100 dark:border-emerald-900">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {allReqs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-3">
                Exigences ({allReqs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allReqs.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 size={14} className="text-[#6CB33F] flex-shrink-0 mt-0.5" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compétences requises */}
          {tender.competences_requises?.length > 0 && (
            <div className="mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-3">
                Compétences requises
              </h3>
              <div className="flex flex-wrap gap-2">
                {tender.competences_requises.map((c, i) => (
                  <span key={i}
                    className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link href="/jobs" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-semibold bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex items-center justify-center gap-2 transition">
              <ArrowLeft size={14} /> Retour
            </button>
          </Link>

          <Link href={`/jobs/${tender._id}/apply`} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-semibold bg-[#6CB33F] hover:bg-[#4E8F2F] text-white shadow flex items-center justify-center gap-2 transition">
              <Send size={14} /> Postuler
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}