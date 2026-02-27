"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getJobs,
  getAllJobs,
  createJob,
  updateJob,
} from "../../services/job.api";
import JobModal from "./JobModal";
import { getUsers } from "../../services/ResponsableMetier.api";
import Pagination from "../../components/Pagination";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Calendar,
  CalendarClock,
  MapPin,
  Send,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR");
}

function getJobStatus(job) {
  const s = (job?.status || "").toString().toUpperCase().trim();
  if (["CONFIRMEE", "REJETEE", "EN_ATTENTE", "VALIDEE"].includes(s)) return s;
  return "EN_ATTENTE";
}

function isExpired(job) {
  if (!job?.dateCloture) return false;
  const d = new Date(job.dateCloture);
  if (Number.isNaN(d.getTime())) return false;
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return end < new Date();
}

function isInactive(job) {
  return isExpired(job);
}

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG = {
  CONFIRMEE: {
    label: "Publiée", // 👈 IMPORTANT
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: Send,
    cardBorder: "border-emerald-200 dark:border-emerald-800",
  },
  VALIDEE: {
    label: "Validée",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
    cardBorder: "border-blue-200 dark:border-blue-800",
  },
  EN_ATTENTE: {
    label: "En attente",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
    cardBorder: "border-amber-200 dark:border-amber-500/40",
  },
  REJETEE: {
    label: "Rejetée",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    icon: XCircle,
    cardBorder: "border-red-300 dark:border-red-700",
  },
};

const EXPIRED_BADGE = {
  label: "Expirée",
  bg: "bg-gray-100 dark:bg-gray-700",
  text: "text-gray-700 dark:text-gray-200",
  border: "border-gray-300 dark:border-gray-600",
};

function StatusBadges({ status, expired }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
  const Icon = config.icon;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={13} />
        {config.label}
      </span>
      {expired && (
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${EXPIRED_BADGE.bg} ${EXPIRED_BADGE.text} ${EXPIRED_BADGE.border}`}>
          {EXPIRED_BADGE.label}
        </span>
      )}
    </div>
  );
}

/* ================= TABS ================= */
const STATUS_TABS = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "VALIDEE", label: "Validées" },
  { key: "CONFIRMEE", label: "Publiées" },
  { key: "REJETEE", label: "Rejetées" },
  { key: "INACTIVE", label: "Inactives" },
];

/* ================= PAGE ================= */
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  async function loadJobs() {
    try {
      const res = await getAllJobs();
      setJobs(res.data || []);
    } catch {
      try {
        const res = await getJobs();
        setJobs(res.data || []);
      } catch (err) {
        console.error("Impossible de charger les offres", err);
        setJobs([]);
      }
    }
  }

  async function loadUsers() {
    try {
      const res = await getUsers();
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.users) ? res.data.users
          : Array.isArray(res?.data?.data) ? res.data.data
            : Array.isArray(res?.data?.data?.users) ? res.data.data.users
              : [];
      setUsers(list);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    (async () => {
      await loadJobs();
      await loadUsers();
    })();
  }, []);

  async function handleCreate(data) {
    await createJob(data);
    setModalOpen(false);
    loadJobs();
  }
  async function handleUpdate(data) {
    await updateJob(editingJob._id, data);
    setEditingJob(null);
    setModalOpen(false);
    loadJobs();
  }

  const normalizedJobs = useMemo(() => {
    return jobs.map((j) => ({
      ...j,
      _normalizedStatus: getJobStatus(j),
      _expired: isExpired(j),
    }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeTab === "all") return normalizedJobs;
    if (activeTab === "INACTIVE") return normalizedJobs.filter((j) => isInactive(j));
    return normalizedJobs.filter((j) => j._normalizedStatus === activeTab);
  }, [normalizedJobs, activeTab]);

  const counts = useMemo(() => {
    const c = {
      all: normalizedJobs.length,
      EN_ATTENTE: 0,
      VALIDEE: 0,
      CONFIRMEE: 0, // = Publiées
      REJETEE: 0,
      INACTIVE: 0
    }; normalizedJobs.forEach((j) => {
      if (c[j._normalizedStatus] !== undefined) c[j._normalizedStatus]++;
      if (isInactive(j)) c.INACTIVE++;
    });
    return c;
  }, [normalizedJobs]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);
  useEffect(() => { setPage(1); }, [activeTab]);

  /* Color helpers */
  function colorMap(key, active) {
    return {
      EN_ATTENTE: active ? "bg-amber-500 text-white" : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
      VALIDEE: active ? "bg-blue-500 text-white" : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
      CONFIRMEE: active ? "bg-green-600 text-white" : "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
      REJETEE: active ? "bg-red-500 text-white" : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
      INACTIVE: active ? "bg-gray-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
    }[key];
  }

  function badgeMap(key, active) {
    return {
      EN_ATTENTE: active ? "bg-white/25 text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      VALIDEE: active ? "bg-white/25 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      CONFIRMEE: active ? "bg-white/25 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
      REJETEE: active ? "bg-white/25 text-white" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      INACTIVE: active ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
    }[key];
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Offres d&apos;emploi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez toutes les offres et confirmez celles en attente
            </p>
          </div>
          <button
            onClick={() => { setEditingJob(null); setModalOpen(true); }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-6 py-3 rounded-xl font-semibold shadow transition-colors"
          >
            Nouvelle offre
          </button>
        </div>



        {/* FILTER BAR — organisée */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl mb-8 overflow-hidden shadow-sm">
          <div className="flex items-center">
            {/* Label */}
            <div className="px-5 py-3.5 border-r border-gray-100 dark:border-gray-700/60 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Statut
              </span>
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-1 px-4 py-2.5 flex-wrap">
              {/* Tous */}
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${activeTab === "all"
                  ? "bg-[#6CB33F] dark:bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
              >
                Tous
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === "all"
                  ? "bg-white/25 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  {counts.all}
                </span>
              </button>

              <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${colorMap(tab.key, active)}`}
                  >
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${badgeMap(tab.key, active)}`}>
                      {counts[tab.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* JOBS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const status = job._normalizedStatus;
            const expired = job._expired;
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${cfg.cardBorder}`}
              >
                {/* title + badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {job.titre}
                  </h3>
                  <StatusBadges status={status} expired={expired} />
                </div>

                {/* description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 whitespace-pre-line">
                  {job.description || "—"}
                </p>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* meta + button */}
                <div className="mt-1 flex items-end justify-between gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    {job.lieu && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{job.lieu}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span> Date de Création : {formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span> Date de Clôture : {formatDate(job.dateCloture)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/recruiter/jobs/${job._id}`}
                    className="h-10 px-6 rounded-full font-semibold text-sm
                               inline-flex items-center justify-center shrink-0
                               bg-[#6CB33F] hover:bg-[#4E8F2F]
                               dark:bg-emerald-600 dark:hover:bg-emerald-500
                               text-white transition-colors"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Aucune offre dans cette catégorie.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <p>Total: {filteredJobs.length} offre(s) — Page {page} / {totalPages}</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
        users={users}
      />
    </div>
  );
}