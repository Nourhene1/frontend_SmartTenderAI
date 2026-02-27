"use client";

import { useEffect, useMemo, useState } from "react";
import { getJobs } from "../services/job.api";
import Link from "next/link";
import Pagination from "../components/Pagination";
import { Calendar, MapPin } from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function shortText(text, max = 180) {
  const t = (text || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim() + "…";
}

/* ================= PAGE ================= */
export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    getJobs().then((res) => setJobs(res.data || []));
  }, []);

  // ✅ Filtrer les offres NON expirées
  const activeJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      if (!job.dateCloture) return true;
      return new Date(job.dateCloture) >= now;
    });
  }, [jobs]);

  const totalPages = Math.max(1, Math.ceil(activeJobs.length / pageSize));

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return activeJobs.slice(start, start + pageSize);
  }, [activeJobs, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* ================= HEADER ================= */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            Offres d&apos;emploi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
            Rejoignez une équipe dynamique et participez à l&apos;aventure de demain.
            Découvrez nos opportunités actuelles.
          </p>
        </div>

        {/* ================= JOBS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition"
            >
              {/* TITRE */}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {job.titre}
              </h3>

              {/* DESCRIPTION courte */}
              <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line mb-4">
                {shortText(job.description, 200)}
              </p>

              <div className="flex items-center justify-between">
                {/* LIEU + DATE */}
                <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {job.lieu && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.lieu}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Clôture : {formatDate(job.dateCloture)}</span>
                  </div>
                </div>

                {/* BOUTON DETAILS */}
                <Link href={`/jobs/${job._id}`}>
                  <button className="px-5 py-2 rounded-full text-sm font-medium transition bg-[#6CB33F] dark:bg-emerald-600 text-white hover:bg-[#4E8F2F] dark:hover:bg-emerald-500 shadow">
                    Voir détails
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {activeJobs.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Aucune offre disponible.
          </p>
        )}

        {/* PAGINATION */}
        {activeJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>
              Total : {activeJobs.length} offre(s) — Page {page} / {totalPages}
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      </div>
      );
}