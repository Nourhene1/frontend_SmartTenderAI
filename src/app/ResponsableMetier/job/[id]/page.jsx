"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getJobById,
  updateMyJob,
} from "../../../services/job.api";

import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  CalendarClock,
  Edit2,
  Briefcase,
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

function parseSkills(str) {
  return String(str || "").split(",").map((t) => t.trim()).filter(Boolean);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/* ================= UI CONFIG ================= */
const STATUS_UI = {
  CONFIRMEE: {
    label: "Publiée",
    pill: "bg-green-100 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  VALIDEE: {
    label: "Validée",
    pill: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
  },
  EN_ATTENTE: {
    label: "En attente",
    pill: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  REJETEE: {
    label: "Rejetée",
    pill: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};

const EXPIRED_UI = {
  label: "Expirée",
  pill: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600",
};

const SCORE_ITEMS = [
  { key: "skillsFit", label: "Skills Fit" },
  { key: "experienceFit", label: "Experience Fit" },
  { key: "projectsFit", label: "Projects Fit" },
  { key: "educationFit", label: "Education Fit" },
  { key: "communicationFit", label: "Communication Fit" },
];

function Pill({ className, children }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border ${className}`}>
      {children}
    </span>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl grid place-items-center bg-[#E9F5E3] dark:bg-emerald-900/25 text-[#4E8F2F] dark:text-emerald-400">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}

/* =================================================================
   PAGE
================================================================= */
export default function ResponsableJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const status = useMemo(() => getJobStatus(job), [job]);
  const expired = useMemo(() => isExpired(job), [job]);

  const ui = STATUS_UI[status] || STATUS_UI.EN_ATTENTE;
  const StatusIcon = ui.icon;

  // ✅ Edit uniquement si EN_ATTENTE
  const canEdit = status === "EN_ATTENTE";

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getJobById(id);
      setJob(res?.data || null);
    } catch (e) {
      console.error("Erreur chargement offre:", e);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleUpdate(payload) {
    if (!job?._id) return;
    setActionLoading(true);
    try {
      await updateMyJob(job._id, payload);
      setEditOpen(false);
      await load();
    } catch (e) {
      console.error("Erreur modification:", e);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="animate-spin" /> Chargement...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-10 text-center">
            <Briefcase className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold">Offre introuvable</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">L&apos;ID est invalide ou l&apos;offre n&apos;est plus accessible.</p>
          </div>
        </div>
      </div>
    );
  }

  const hardSkills = Array.isArray(job.hardSkills) ? job.hardSkills : [];
  const softSkills = Array.isArray(job.softSkills) ? job.softSkills : [];

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

        {/* TOP BAR */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
            <ArrowLeft size={16} /> Retour
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Pill className={ui.pill}>
              <StatusIcon size={14} />
              {ui.label}
            </Pill>

            {expired && (
              <Pill className={EXPIRED_UI.pill}>{EXPIRED_UI.label}</Pill>
            )}

            
          </div>
        </div>

        {/* HERO CARD */}
        <div className="mt-6 rounded-[32px] border border-gray-100 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 backdrop-blur shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{job.titre}</h1>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard icon={MapPin} label="Lieu" value={job.lieu || "—"} />
              <InfoCard icon={Calendar} label="Créée" value={formatDate(job.createdAt)} />
              <InfoCard icon={CalendarClock} label="Clôture" value={formatDate(job.dateCloture)} />
            </div>
            {status === "REJETEE" && job.rejectionReason && (
              <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-red-600 dark:text-red-400">Motif du rejet</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{job.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* DESCRIPTION + ACTIONS */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</h2>
              <p className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">{job.description || "—"}</p>
            </div>
          </div>

          <div>
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</h3>
              <div className="mt-5 space-y-3">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => setEditOpen(true)}
                      disabled={actionLoading}
                      className="w-full h-11 px-5 rounded-full font-semibold inline-flex items-center justify-center gap-2
                                 bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500
                                 text-white transition-colors disabled:opacity-50"
                    >
                      <Edit2 size={18} /> Modifier l&apos;offre
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Vous pouvez modifier uniquement les offres <span className="font-semibold">en attente</span>.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Aucune action disponible sur cette offre.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SKILLS */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Hard skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {hardSkills.map((s, i) => (
                <span key={i} className="bg-[#E9F5E3] dark:bg-gray-700 text-[#4E8F2F] dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-[#d7ebcf] dark:border-gray-600">
                  {s}
                </span>
              ))}
              {!hardSkills.length && <span className="text-sm text-gray-500 dark:text-gray-400">—</span>}
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-7">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-500 dark:text-gray-400">Soft skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {softSkills.map((s, i) => (
                <span key={i} className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
                  {s}
                </span>
              ))}
              {!softSkills.length && <span className="text-sm text-gray-500 dark:text-gray-400">—</span>}
            </div>
          </div>
        </div>

      </div>

      {/* EDIT MODAL avec pondérations */}
      <EditJobModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={job}
        loading={actionLoading}
        onSubmit={handleUpdate}
      />

    </div>
  );
}

/* =================================================================
   MODAL — Modifier (responsable) avec pondérations ✅
================================================================= */
function EditJobModal({ open, onClose, initialData, onSubmit, loading }) {
  const isOpen = !!open;

  const [form, setForm] = useState({
    titre: "",
    description: "",
    hardSkills: "",
    softSkills: "",
    dateCloture: "",
    lieu: "",
    scores: {
      skillsFit: 30,
      experienceFit: 30,
      projectsFit: 20,
      educationFit: 10,
      communicationFit: 10,
    },
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setForm({
      titre: initialData?.titre || "",
      description: initialData?.description || "",
      hardSkills: Array.isArray(initialData?.hardSkills) ? initialData.hardSkills.join(", ") : initialData?.hardSkills || "",
      softSkills: Array.isArray(initialData?.softSkills) ? initialData.softSkills.join(", ") : initialData?.softSkills || "",
      dateCloture: initialData?.dateCloture ? String(initialData.dateCloture).slice(0, 10) : "",
      lieu: initialData?.lieu || "",
      scores: {
        skillsFit: initialData?.scores?.skillsFit ?? 30,
        experienceFit: initialData?.scores?.experienceFit ?? 30,
        projectsFit: initialData?.scores?.projectsFit ?? 20,
        educationFit: initialData?.scores?.educationFit ?? 10,
        communicationFit: initialData?.scores?.communicationFit ?? 10,
      },
    });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const totalWeights = Object.values(form.scores || {}).reduce((sum, v) => sum + Number(v || 0), 0);
  const isValidTotal = totalWeights === 100;

  function setScore(key, value) {
    setError("");
    const v = clamp(value, 0, 100);
    setForm((p) => ({ ...p, scores: { ...p.scores, [key]: v } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.titre.trim()) return setError("❌ Le titre est obligatoire.");
    if (!form.description.trim()) return setError("❌ La description est obligatoire.");
    if (!form.lieu.trim()) return setError("❌ Le lieu est obligatoire.");
    if (!form.dateCloture) return setError("❌ La date de clôture est obligatoire.");
    if (!isValidTotal) return setError("❌ La somme des pondérations doit être égale à 100%.");

    await onSubmit({
      titre: form.titre.trim(),
      description: form.description.trim(),
      lieu: form.lieu.trim(),
      dateCloture: form.dateCloture,
      hardSkills: parseSkills(form.hardSkills),
      softSkills: parseSkills(form.softSkills),
      scores: {
        skillsFit: Number(form.scores.skillsFit) || 0,
        experienceFit: Number(form.scores.experienceFit) || 0,
        projectsFit: Number(form.scores.projectsFit) || 0,
        educationFit: Number(form.scores.educationFit) || 0,
        communicationFit: Number(form.scores.communicationFit) || 0,
      },
    });
  }

  const inputBase =
    "w-full h-11 px-5 rounded-full border border-gray-200 dark:border-gray-600 " +
    "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-500 " +
    "focus:border-[#6CB33F] dark:focus:border-emerald-500 " +
    "focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 " +
    "outline-none transition-colors";

  const labelBase = "block text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 mb-2 uppercase";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="px-8 pt-7 pb-5 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Modifier l&apos;offre</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Disponible uniquement pour les offres en attente.</p>
          </div>
          <button onClick={onClose}
            className="h-10 w-10 rounded-full grid place-items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            ✕
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className={labelBase}>Titre</label>
            <input className={inputBase} value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </div>

          {/* Description */}
          <div>
            <label className={labelBase}>Description</label>
            <textarea rows={5}
              className="w-full px-5 py-4 rounded-3xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:border-[#6CB33F] dark:focus:border-emerald-500 focus:ring-4 focus:ring-[#6CB33F]/15 dark:focus:ring-emerald-500/20 outline-none transition-colors"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Lieu + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>Lieu</label>
              <input className={inputBase} value={form.lieu}
                onChange={(e) => setForm({ ...form, lieu: e.target.value })} />
            </div>
            <div>
              <label className={labelBase}>Date de clôture</label>
              <input type="date" className={inputBase} value={form.dateCloture}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, dateCloture: e.target.value })} />
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase}>Hard Skills (virgule)</label>
              <input className={inputBase} value={form.hardSkills}
                onChange={(e) => setForm({ ...form, hardSkills: e.target.value })}
                placeholder="React, Node.js, MongoDB..." />
            </div>
            <div>
              <label className={labelBase}>Soft Skills (virgule)</label>
              <input className={inputBase} value={form.softSkills}
                onChange={(e) => setForm({ ...form, softSkills: e.target.value })}
                placeholder="Communication, Leadership..." />
            </div>
          </div>

          {/* ✅ PONDÉRATIONS */}
          {/* ================= PONDÉRATIONS ================= */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                PONDÉRATIONS (0 – 100)
              </h3>

              <span className={`text-sm font-extrabold ${isValidTotal
                  ? "text-green-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
                }`}>
                Total : {totalWeights}%
              </span>
            </div>

            <div className="space-y-6">

              {[
                { key: "skillsFit", label: "Skills Fit" },
                { key: "experienceFit", label: "Professional Experience Fit" },
                { key: "projectsFit", label: "Projects Fit & Impact" },
                { key: "educationFit", label: "Education / Certifications" },
                { key: "communicationFit", label: "Communication / Clarity signals" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">

                  {/* Label */}
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {item.label}
                  </span>

                  {/* Input + % */}
                  <div className="flex items-center gap-3">

                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.scores[item.key]}
                      onChange={(e) => setScore(item.key, e.target.value)}
                      className="
              w-24 h-11
              rounded-full
              border border-gray-300 dark:border-gray-600
              bg-gray-100 dark:bg-gray-700
              text-center text-base font-semibold
              text-gray-800 dark:text-white
              focus:outline-none
              focus:border-[#6CB33F]
              focus:ring-2 focus:ring-[#6CB33F]/20
              transition
            "
                    />

                    <span className="text-green-600 dark:text-emerald-400 font-bold">
                      %
                    </span>

                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="h-11 px-6 rounded-full border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading || !isValidTotal}
              className="h-11 px-6 rounded-full bg-[#6CB33F] hover:bg-[#4E8F2F] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}