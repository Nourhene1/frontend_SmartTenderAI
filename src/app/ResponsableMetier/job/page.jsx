"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/Pagination";

import {
  createJob,
  getMyOffers,
  updateMyJob,
  getMyAssignedJobs,
} from "../../services/job.api";

import {
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CalendarClock,
  CalendarCheck,
  MapPin,
  Tag,
  BrainCircuit,
  Send,
} from "lucide-react";

/* ================= UTILS ================= */
function formatDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch {
    return "—";
  }
}

function getJobStatus(job) {
  const s = (job?.status || "").toString().toUpperCase().trim();
  if (["CONFIRMEE", "REJETEE", "EN_ATTENTE", "VALIDEE"].includes(s)) return s;
  return "EN_ATTENTE";
}

function parseSkillsField(value) {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG = {
  CONFIRMEE: {
    label: "Publiée",
    bg: "bg-green-100 dark:bg-emerald-900/30",
    text: "text-green-700 dark:text-emerald-400",
    border: "border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
    cardBorder: "border-green-200 dark:border-emerald-800",
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
    cardBorder: "border-amber-700 dark:border-amber-500/40",
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

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

/* ================= ORIGIN BADGE ================= */
function OriginBadge({ origin }) {
  const cfg =
    origin === "CREATED"
      ? {
          label: "Créée",
          cls: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
        }
      : origin === "ASSIGNED"
      ? {
          label: "Assignée",
          cls: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
        }
      : {
          label: "Créée & assignée",
          cls: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.cls}`}
    >
      <Tag size={13} />
      {cfg.label}
    </span>
  );
}

/* ================= FILTERS ================= */
const STATUS_TABS = [
  { key: "EN_ATTENTE", label: "En attente" },
  { key: "VALIDEE",    label: "Validées" },
  { key: "CONFIRMEE",  label: "Publiées" },
  { key: "REJETEE",    label: "Rejetées" },
];

const ORIGIN_FILTERS = [
  { key: "all",      label: "Toutes" },
  { key: "CREATED",  label: "Créées" },
  { key: "ASSIGNED", label: "Assignées" },
];


/* =================================================================
   PAGE
================================================================= */
export default function ResponsableJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");

  const [expandedJobs, setExpandedJobs] = useState({});

  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [createdRes, assignedRes] = await Promise.allSettled([
        getMyOffers(),
        getMyAssignedJobs(),
      ]);

      const created = Array.isArray(createdRes?.value?.data) ? createdRes.value.data : [];
      const assigned = Array.isArray(assignedRes?.value?.data) ? assignedRes.value.data : [];

      const map = new Map();
      for (const j of created) map.set(j._id, { ...j, _origin: "CREATED" });
      for (const j of assigned) {
        if (map.has(j._id)) {
          map.set(j._id, { ...map.get(j._id), ...j, _origin: "BOTH" });
        } else {
          map.set(j._id, { ...j, _origin: "ASSIGNED" });
        }
      }

      const merged = Array.from(map.values()).map((j) => ({
        ...j,
        _status: getJobStatus(j),
      }));
      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setJobs(merged);
    } catch (e) {
      console.error("Erreur chargement jobs:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const detailsBase = "/ResponsableMetier/job";

  function toggleReadMore(jobId) {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  }

  // ✅ counts inclut VALIDEE et PUBLIEE
  const counts = useMemo(() => {
    const c = { all: jobs.length, EN_ATTENTE: 0, VALIDEE: 0,  CONFIRMEE: 0, REJETEE: 0 };
    for (const j of jobs) {
      const s = j._status || getJobStatus(j);
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [jobs]);

  const originCounts = useMemo(() => {
    const o = { all: jobs.length, CREATED: 0, ASSIGNED: 0 };
    for (const j of jobs) {
      if (j._origin === "CREATED") o.CREATED++;
      if (j._origin === "ASSIGNED") o.ASSIGNED++;
      if (j._origin === "BOTH") { o.CREATED++; o.ASSIGNED++; }
    }
    return o;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let arr = [...jobs];
    if (originFilter !== "all") {
      arr = arr.filter((j) => {
        if (originFilter === "CREATED") return j._origin === "CREATED" || j._origin === "BOTH";
        if (originFilter === "ASSIGNED") return j._origin === "ASSIGNED" || j._origin === "BOTH";
        return true;
      });
    }
    if (activeTab !== "all") {
      arr = arr.filter((j) => (j._status || getJobStatus(j)) === activeTab);
    }
    return arr;
  }, [jobs, activeTab, originFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page]);

  useEffect(() => { setPage(1); }, [activeTab, originFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  async function handleCreate(payload) {
    await createJob(payload);
    setModalOpen(false);
    setEditingJob(null);
    await loadData();
  }

  async function handleUpdate(payload) {
    await updateMyJob(editingJob?._id, payload);
    setModalOpen(false);
    setEditingJob(null);
    await loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

        {/* HEADER */}
        <div className="flex justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Offres Responsable Métier
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tes offres créées + celles assignées par l'administrateur
            </p>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>Total : <span className="font-extrabold">{jobs.length}</span> offre(s)</p>
              <p>
                <span className="font-semibold">Créées :</span> {originCounts.CREATED} —{" "}
                <span className="font-semibold">Assignées :</span> {originCounts.ASSIGNED}
              </p>
            </div>
          </div>

          <button
            onClick={() => { setEditingJob(null); setModalOpen(true); }}
            className="bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                       text-white px-6 py-3 rounded-xl font-extrabold shadow transition-colors
                       flex items-center gap-2"
          >
            <Plus size={18} /> Nouvelle offre
          </button>
        </div>



        {/* FILTER BAR — redesigned */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl mb-8 overflow-hidden shadow-sm">

          {/* ROW 1 — Origine */}
          <div className="flex items-center gap-0 border-b border-gray-100 dark:border-gray-700/60">
            {/* Label */}
            <div className="px-5 py-3.5 border-r border-gray-100 dark:border-gray-700/60 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                Origine
              </span>
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-1 px-4 py-2.5 flex-wrap">
              {ORIGIN_FILTERS.map((f) => {
                const active = originFilter === f.key;
                const badgeCount = f.key === "all" ? originCounts.all : originCounts[f.key] || 0;
                return (
                  <button
                    key={f.key}
                    onClick={() => setOriginFilter(f.key)}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${
                      active
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {f.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      active
                        ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {badgeCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROW 2 — Statut */}
          <div className="flex items-center gap-0">
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
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${
                  activeTab === "all"
                    ? "bg-[#6CB33F] dark:bg-emerald-600 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                Tous
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === "all"
                    ? "bg-white/25 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {counts.all}
                </span>
              </button>

              {/* Separator */}
              <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.key;
                const colorMap = {
                  EN_ATTENTE: active ? "bg-amber-500 text-white"   : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
                  VALIDEE:    active ? "bg-blue-500 text-white"    : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  CONFIRMEE:  active ? "bg-green-600 text-white"   : "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20",
                  REJETEE:    active ? "bg-red-500 text-white"     : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                };
                const badgeColor = {
                  EN_ATTENTE: active ? "bg-white/25 text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                  VALIDEE:    active ? "bg-white/25 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                  CONFIRMEE:  active ? "bg-white/25 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                  REJETEE:    active ? "bg-white/25 text-white" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-150 ${colorMap[tab.key]}`}
                  >
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${badgeColor[tab.key]}`}>
                      {counts[tab.key] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* JOBS GRID — ✅ pas de bouton edit dans les cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedJobs.map((job) => {
            const status = job._status || getJobStatus(job);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.EN_ATTENTE;
            const isExpanded = !!expandedJobs[job._id];
            const hasLongDesc = (job.description || "").length > 160;

            return (
              <div
                key={job._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition-all duration-300 border ${cfg.cardBorder}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                      {job.titre || "Sans titre"}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <OriginBadge origin={job._origin || "CREATED"} />
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </div>

                {/* rejection reason */}
                {status === "REJETEE" && job.rejectionReason && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 mb-3">
                    <p className="text-xs font-extrabold text-red-600 dark:text-red-400 uppercase mb-1">Motif du rejet</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{job.rejectionReason}</p>
                  </div>
                )}

                {/* Description */}
                <p className={`text-gray-700 dark:text-gray-200 text-sm mb-2 whitespace-pre-line ${!isExpanded ? "line-clamp-3" : ""}`}>
                  {job.description || "—"}
                </p>

                {hasLongDesc && (
                  <button
                    type="button"
                    onClick={() => toggleReadMore(job._id)}
                    className="text-sm text-[#4E8F2F] dark:text-emerald-400 font-extrabold hover:underline self-start mb-2"
                  >
                    {isExpanded ? "Réduire ↑" : "Lire la suite →"}
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                {/* Meta + actions — ✅ UNIQUEMENT bouton Détails, pas d'edit */}
                <div className="mt-auto relative">
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 pr-32">
                    {job.lieu && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span>{job.lieu}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                      <span>Créée : {formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock size={16} className="text-gray-500 dark:text-gray-400" />
                      <span>Clôture : {formatDate(job.dateCloture)}</span>
                    </div>
                    {job.confirmedAt && (
                      <div className="flex items-center gap-2">
                        <CalendarCheck size={16} className="text-gray-500 dark:text-gray-400" />
                        <span>Confirmée : {formatDate(job.confirmedAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Link
                      href={`${detailsBase}/${job._id}`}
                      className="h-11 px-7 rounded-full font-extrabold text-sm inline-flex items-center justify-center
                                 bg-[#6CB33F] hover:bg-[#4E8F2F]
                                 dark:bg-emerald-600 dark:hover:bg-emerald-500
                                 text-white shadow-md shadow-green-500/20 transition-colors"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 border-2 border-dashed border-[#6CB33F] dark:border-emerald-600 rounded-2xl p-12 text-center">
              <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold">Aucune offre pour ce filtre.</p>
              <button
                onClick={() => { setEditingJob(null); setModalOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                           bg-[#6CB33F] hover:bg-[#4E8F2F]
                           dark:bg-emerald-600 dark:hover:bg-emerald-500
                           text-white text-sm font-extrabold transition-colors"
              >
                <Plus size={16} /> Proposer une offre
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-10 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <p>Total : {filteredJobs.length} — Page {page} / {totalPages}</p>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modal */}
      <JobOfferModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingJob(null); }}
        onSubmit={editingJob ? handleUpdate : handleCreate}
        initialData={editingJob}
      />
    </div>
  );
}


/* =================================================================
   MODAL — Create / Edit Job Offer (design identique au JobModal admin)
================================================================= */
function JobOfferModal({ open, onClose, onSubmit, initialData }) {
  const isEditing = !!initialData;

  const emptyForm = {
    titre: "",
    description: "",
    lieu: "",
    dateCloture: "",
    hardSkills: "",
    softSkills: "",
    scores: {
      skillsFit: 30,
      experienceFit: 30,
      projectsFit: 20,
      educationFit: 10,
      communicationFit: 10,
    },
  };

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generateQuiz, setGenerateQuiz] = useState(true);
  const [numQuestions, setNumQuestions] = useState(25);

  const SCORE_ITEMS_MODAL = [
    { key: "skillsFit",        label: "Skills Fit" },
    { key: "experienceFit",    label: "Professional Experience Fit" },
    { key: "projectsFit",      label: "Projects Fit & Impact" },
    { key: "educationFit",     label: "Education / Certifications" },
    { key: "communicationFit", label: "Communication / Clarity signals" },
  ];

  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      if (initialData) {
        setForm({
          titre:       initialData.titre || "",
          description: initialData.description || "",
          lieu:        initialData.lieu || "",
          dateCloture: initialData.dateCloture ? String(initialData.dateCloture).slice(0, 10) : "",
          hardSkills:  Array.isArray(initialData.hardSkills) ? initialData.hardSkills.join(", ") : initialData.hardSkills || "",
          softSkills:  Array.isArray(initialData.softSkills) ? initialData.softSkills.join(", ") : initialData.softSkills || "",
          scores: {
            skillsFit:        initialData?.scores?.skillsFit        ?? 30,
            experienceFit:    initialData?.scores?.experienceFit    ?? 30,
            projectsFit:      initialData?.scores?.projectsFit      ?? 20,
            educationFit:     initialData?.scores?.educationFit     ?? 10,
            communicationFit: initialData?.scores?.communicationFit ?? 10,
          },
        });
        setGenerateQuiz(initialData.generateQuiz !== false);
        setNumQuestions(typeof initialData.numQuestions === "number" ? initialData.numQuestions : 25);
      } else {
        setForm(emptyForm);
        setGenerateQuiz(true);
        setNumQuestions(25);
      }
      setFormError("");
      setSubmitting(false);
    });
  }, [open, initialData]);

  if (!open) return null;

  const totalWeights = Object.values(form.scores || {}).reduce((sum, v) => sum + Number(v || 0), 0);
  const isValidTotal = totalWeights === 100;

  function setWeight(key, value) {
    setFormError("");
    let v = Number(value);
    if (Number.isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setForm((prev) => ({ ...prev, scores: { ...prev.scores, [key]: v } }));
  }

  function handleNumQuestions(val) {
    let n = parseInt(val, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 30) n = 30;
    setNumQuestions(n);
  }

  function parseSkills(str) {
    return String(str || "").split(",").map((t) => t.trim()).filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.titre.trim())       return setFormError("❌ Le titre du poste est obligatoire.");
    if (!form.description.trim()) return setFormError("❌ La description est obligatoire.");
    if (!form.lieu.trim())        return setFormError("❌ Le lieu du poste est obligatoire.");
    if (!form.dateCloture)        return setFormError("❌ La date de clôture est obligatoire.");
    if (!isValidTotal)            return setFormError("❌ La somme des pondérations doit être égale à 100%.");

    const payload = {
      titre:        form.titre.trim(),
      description:  form.description.trim(),
      lieu:         form.lieu.trim(),
      dateCloture:  form.dateCloture,
      hardSkills:   parseSkills(form.hardSkills),
      softSkills:   parseSkills(form.softSkills),
      scores: form.scores,
      ...(!isEditing && {
        generateQuiz,
        numQuestions: generateQuiz ? numQuestions : 0,
      }),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      console.error("Erreur submit modal:", err);
      setFormError("❌ Une erreur est survenue. Vérifie les champs et réessaie.");
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-full " +
    "border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 " +
    "text-gray-800 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:border-[#6CB33F] dark:focus:border-emerald-500 " +
    "focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 " +
    "outline-none transition-colors";

  const labelBase =
    "block text-xs sm:text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300">

        {/* HEADER */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {isEditing ? "Modifier l'offre" : "Nouvelle offre"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tous les champs marqués <span className="text-red-500">*</span> sont obligatoires.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-10 w-10 rounded-full grid place-items-center
                         text-gray-500 dark:text-gray-400
                         hover:text-gray-800 dark:hover:text-white
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="space-y-5 sm:space-y-6">

              {/* ERROR */}
              {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
                  {formError}
                </div>
              )}

              {/* TITRE */}
              <div>
                <label className={labelBase}>Titre du poste <span className="text-red-500">*</span></label>
                <input
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className={inputBase}
                  placeholder="Ex: Fullstack Developer (React/Node)"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className={labelBase}>Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl
                             border border-gray-200 dark:border-gray-600
                             bg-white dark:bg-gray-700
                             text-gray-800 dark:text-gray-100
                             placeholder-gray-400 dark:placeholder-gray-500
                             resize-none
                             focus:border-[#6CB33F] dark:focus:border-emerald-500
                             focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20
                             outline-none transition-colors"
                  placeholder="Décrivez la mission, le profil recherché, responsabilités..."
                />
              </div>

              {/* LIEU */}
              <div>
                <label className={labelBase}>Lieu du poste <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                    📍
                  </span>
                  <input
                    value={form.lieu}
                    onChange={(e) => setForm({ ...form, lieu: e.target.value })}
                    placeholder="Ex: Sfax, Tunis, Télétravail..."
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl sm:rounded-full
                               border border-gray-200 dark:border-gray-600
                               bg-white dark:bg-gray-700
                               text-gray-800 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:border-[#6CB33F] dark:focus:border-emerald-500
                               focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20
                               outline-none transition-colors"
                  />
                </div>
              </div>

              {/* DATE */}
              <div>
                <label className={labelBase}>Date de clôture <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.dateCloture}
                  onChange={(e) => setForm({ ...form, dateCloture: e.target.value })}
                  min={new Date().toISOString().slice(0, 10)}
                  className={inputBase}
                />
              </div>

              {/* SKILLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className={labelBase}>Hard Skills</label>
                  <input
                    value={form.hardSkills}
                    onChange={(e) => setForm({ ...form, hardSkills: e.target.value })}
                    placeholder="React, Node.js, SQL, Docker..."
                    className={inputBase}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Séparées par une virgule.</p>
                </div>
                <div>
                  <label className={labelBase}>Soft Skills</label>
                  <input
                    value={form.softSkills}
                    onChange={(e) => setForm({ ...form, softSkills: e.target.value })}
                    placeholder="Communication, Leadership..."
                    className={inputBase}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Séparées par une virgule.</p>
                </div>
              </div>

              {/* QUIZ — uniquement en création */}
              {!isEditing && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={generateQuiz}
                        onChange={(e) => setGenerateQuiz(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${generateQuiz ? "bg-[#6CB33F] dark:bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${generateQuiz ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-[#6CB33F] dark:text-emerald-400" />
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">Générer un quiz technique</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Un quiz IA sera créé automatiquement à la publication de l&apos;offre.
                      </p>
                    </div>
                  </label>

                  {generateQuiz && (
                    <div className="flex items-center gap-4 pl-14">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Nombre de questions
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleNumQuestions(numQuestions - 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600
                                     text-gray-700 dark:text-gray-300 font-bold
                                     hover:bg-gray-100 dark:hover:bg-gray-700
                                     transition-colors flex items-center justify-center"
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={numQuestions}
                          onChange={(e) => handleNumQuestions(e.target.value)}
                          className="w-16 h-9 text-center rounded-xl
                                     border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-700
                                     text-gray-800 dark:text-gray-100 font-bold
                                     focus:border-[#6CB33F] dark:focus:border-emerald-500
                                     focus:ring-2 focus:ring-[#6CB33F]/20
                                     outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleNumQuestions(numQuestions + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600
                                     text-gray-700 dark:text-gray-300 font-bold
                                     hover:bg-gray-100 dark:hover:bg-gray-700
                                     transition-colors flex items-center justify-center"
                        >+</button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">(max 30)</span>
                      </div>
                    </div>
                  )}

                  {!generateQuiz && (
                    <p className="pl-14 text-xs text-gray-400 dark:text-gray-500 italic">
                      Aucun quiz ne sera généré. Vous pourrez en créer un manuellement plus tard.
                    </p>
                  )}
                </div>
              )}

              {/* PONDÉRATIONS */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">
                    Pondérations (0 – 100)
                  </h3>
                  <span className={`text-sm font-extrabold ${isValidTotal ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    Total : {totalWeights}%
                  </span>
                </div>

                <div className="space-y-4">
                  {SCORE_ITEMS_MODAL.map((it) => {
                    const v = form.scores[it.key] ?? 0;
                    return (
                      <div key={it.key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <p className="sm:flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {it.label}
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={v}
                            onChange={(e) => setWeight(it.key, e.target.value)}
                            className="w-24 h-11 px-4 rounded-xl sm:rounded-full
                                       border border-gray-200 dark:border-gray-600
                                       bg-white dark:bg-gray-700
                                       text-gray-800 dark:text-gray-100
                                       focus:border-[#6CB33F] dark:focus:border-emerald-500
                                       focus:ring-4 focus:ring-[#6CB33F]/15
                                       outline-none transition-colors"
                          />
                          <span className="text-sm font-extrabold text-[#4E8F2F] dark:text-emerald-400 w-10">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isValidTotal && (
                  <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
                    La somme des pondérations doit être égale à 100% pour pouvoir enregistrer.
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={submitting || !isValidTotal}
                className={`sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold transition-colors shadow-sm
                  ${isValidTotal && !submitting
                    ? "bg-[#6CB33F] hover:bg-[#5AA332] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
              >
                {submitting
                  ? "Enregistrement..."
                  : isEditing
                    ? "Mettre à jour"
                    : generateQuiz
                      ? `Créer + Générer ${numQuestions} questions`
                      : "Créer l'offre"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError("");
                  setGenerateQuiz(true);
                  setNumQuestions(25);
                  onClose();
                }}
                disabled={submitting}
                className="sm:flex-1 h-11 sm:h-12 rounded-xl sm:rounded-full font-semibold
                           border border-gray-200 dark:border-gray-600
                           text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-700
                           transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}