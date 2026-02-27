"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  getJobById,
  updateJob,
  deleteJob,
  confirmJob,
  reactivateJob,
} from "../../../services/job.api";


import JobModal from "../JobModal";
import DeleteJobModal from "../DeleteJobModal";

import {
  Calendar, CalendarClock, ArrowLeft, CheckCircle2,
  Trash2, Edit2, MapPin, Briefcase, Loader2, BadgeInfo,
  GraduationCap, Users, Wallet, FileText, Zap, RefreshCw,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" }) : "—";

const isExpired = (job) => {
  if (!job?.dateCloture) return false;
  const d = new Date(job.dateCloture);
  return !isNaN(d) && new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59) < new Date();
};

const hasVal = (v) => v !== null && v !== undefined && String(v).trim() !== "";

const CONTRAT = { CDD:"CDD", CDI:"CDI", STAGE:"Stage", FREELANCE:"Freelance", ALTERNANCE:"Alternance", INTERIM:"Intérim" };
const MOTIF   = { NOUVEAU:"Nouveau poste", REMPLACEMENT:"Remplacement", RENFORT:"Renfort" };
const SEXE    = { H:"H", F:"F", HF:"HF" };
const pretty  = (map, v) => map[String(v||"").toUpperCase().trim()] || v || "—";

/* ─── page ──────────────────────────────────────────────── */
export default function RecruiterJobDetailsPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [job,           setJob]           = useState(null);
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [busy,          setBusy]          = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [reactOpen,     setReactOpen]     = useState(false);
  const [newDate,       setNewDate]       = useState("");

  const expired = useMemo(() => isExpired(job), [job]);

  async function load() {
    if (!id) return;
    setLoading(true);
    try   { setJob((await getJobById(id))?.data ?? null); }
    catch { setJob(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
   
  },[]);

  async function wrap(fn) {
    setBusy(true);
    try   { await fn(); }
    catch (e) { console.error(e); }
    finally { setBusy(false); }
  }

  const handleUpdate     = async (data) => wrap(async () => { await updateJob(job._id, data); setEditOpen(false);  await load(); });
  const handleDelete     = async ()     => wrap(async () => { await deleteJob(job._id);       router.push("/recruiter/jobs"); });
  const handleReactivate = async ()     => wrap(async () => {
    if (!newDate) return;
    await reactivateJob(job._id, newDate);
    setReactOpen(false); setNewDate(""); await load();
  });

  const hard = (job?.hardSkills ?? []).filter(Boolean);
  const soft = (job?.softSkills ?? []).filter(Boolean);

  const metaItems = [
    { Icon: MapPin,        label: "Localisation",  value: job?.lieu || "—" },
    { Icon: Calendar,      label: "Créée le",      value: fmtDate(job?.createdAt) },
    { Icon: CalendarClock, label: "Clôture",       value: fmtDate(job?.dateCloture) },
    hasVal(job?.typeContrat) && { Icon: FileText,       label: "Contrat",   value: pretty(CONTRAT, job.typeContrat) },
    hasVal(job?.motif)       && { Icon: BadgeInfo,      label: "Motif",     value: pretty(MOTIF,   job.motif) },
    hasVal(job?.sexe)        && { Icon: Users,          label: "Profil",    value: pretty(SEXE,    job.sexe) },
    hasVal(job?.typeDiplome) && { Icon: GraduationCap,  label: "Diplôme",   value: String(job.typeDiplome) },
    hasVal(job?.salaire)     && { Icon: Wallet,         label: "Salaire",   value: String(job.salaire) },
  ].filter(Boolean);

  /* loading */
  if (loading) return (
    <div className="jd-page jd-center">
      <Loader2 className="jd-spin" size={34} />
      <span className="jd-loading-txt">Chargement…</span>
      <style>{BASE_CSS}</style>
    </div>
  );

  /* not found */
  if (!job) return (
    <div className="jd-page">
      <style>{BASE_CSS}</style>
      <div className="jd-wrap">
        <Link href="/recruiter/jobs" className="jd-back">
          <ArrowLeft size={14}/> Retour aux offres
        </Link>
        <div className="jd-empty">
          <Briefcase size={38} className="jd-empty-icon"/>
          <p className="jd-empty-txt">Offre introuvable</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="jd-page">
      <style>{BASE_CSS}</style>

      <div className="jd-wrap">

        {/* ── Topbar ── */}
        <div className="jd-topbar">
          <Link href="/recruiter/jobs" className="jd-back">
            <ArrowLeft size={14}/> Retour
          </Link>
          <div className="jd-top-actions">
            {expired && (
              <button className="jd-btn jd-btn-blue" onClick={() => setReactOpen(true)} disabled={busy}>
                <RefreshCw size={13}/> Réactiver
              </button>
            )}
            <button className="jd-btn jd-btn-green" onClick={() => setEditOpen(true)} disabled={busy}>
              <Edit2 size={13}/> Modifier
            </button>
            <button className="jd-btn jd-btn-ghost jd-icon-btn" onClick={() => setDeleteOpen(true)} disabled={busy}>
              <Trash2 size={15}/>
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <header className="jd-hero">
          {/* Decorative orbs */}
          <div className="jd-orb jd-orb-1"/>
          <div className="jd-orb jd-orb-2"/>

          <div className="jd-hero-inner">
            <div className="jd-badges">
              <span className="jd-badge jd-badge-green">
                <CheckCircle2 size={11}/> Publiée
              </span>
              {expired && (
                <span className="jd-badge jd-badge-gray">
                  <Zap size={11}/> Expirée
                </span>
              )}
            </div>

            <h1 className="jd-title">{job.titre}</h1>

            <div className="jd-meta-grid">
              {metaItems.map(({ Icon, label, value }, i) => (
                <div key={i} className="jd-meta-card">
                  <div className="jd-meta-icon-wrap">
                    <Icon size={15}/>
                  </div>
                  <div>
                    <p className="jd-meta-label">{label}</p>
                    <p className="jd-meta-value">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── Description ── */}
        <section className="jd-card jd-desc-card">
          <div className="jd-section-head">
            <span className="jd-dot jd-dot-dark"/>
            <h2 className="jd-section-title">Description du poste</h2>
          </div>
          <p className="jd-desc">{job.description || "—"}</p>
        </section>

        {/* ── Skills ── */}
        {(hard.length > 0 || soft.length > 0) && (
          <div className="jd-skills-grid">
            {hard.length > 0 && (
              <div className="jd-card">
                <div className="jd-section-head">
                  <span className="jd-dot jd-dot-green"/>
                  <h2 className="jd-section-title">Hard Skills</h2>
                </div>
                <div className="jd-tags">
                  {hard.map((s,i) => <span key={i} className="jd-tag jd-tag-green">{s}</span>)}
                </div>
              </div>
            )}
            {soft.length > 0 && (
              <div className="jd-card">
                <div className="jd-section-head">
                  <span className="jd-dot jd-dot-blue"/>
                  <h2 className="jd-section-title">Soft Skills</h2>
                </div>
                <div className="jd-tags">
                  {soft.map((s,i) => <span key={i} className="jd-tag jd-tag-blue">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

      </div>{/* /jd-wrap */}

      {/* ── Modals ── */}
      <JobModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate} initialData={job} users={users}/>
      <DeleteJobModal open={deleteOpen} job={job} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}/>

      {reactOpen && (
        <div className="jd-overlay" onMouseDown={e => { if (e.target === e.currentTarget) setReactOpen(false); }}>
          <div className="jd-modal">
            <div className="jd-modal-hd">
              <div>
                <h3 className="jd-modal-title">Réactiver l&apos;offre</h3>
                <p className="jd-modal-sub">Nouvelle date de clôture</p>
              </div>
              <button className="jd-modal-x" onClick={() => setReactOpen(false)}>✕</button>
            </div>
            <hr className="jd-modal-hr"/>
            <div className="jd-modal-body">
              <input
                type="date"
                value={newDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setNewDate(e.target.value)}
                className="jd-date-input"
              />
              <div className="jd-modal-actions">
                <button className="jd-btn jd-btn-ghost" onClick={() => setReactOpen(false)}>Annuler</button>
                <button
                  className="jd-btn jd-btn-blue"
                  onClick={handleReactivate}
                  disabled={!newDate || busy}
                >
                  {busy ? <Loader2 size={13} className="jd-spin"/> : <RefreshCw size={13}/>}
                  Réactiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── CSS ─────────────────────────────────────────────── */
const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

.jd-page {
  min-height: 100vh;
  background: linear-gradient(150deg, #f0fdf4 0%, #dcfce7 35%, #f0faf0 70%, #fafffe 100%);
  font-family: 'DM Sans', sans-serif;
  padding-bottom: 80px;
}
.jd-page *,.jd-page *::before,.jd-page *::after { box-sizing: border-box; }
.jd-center { display:flex; align-items:center; justify-content:center; gap:12px; }
.jd-loading-txt { font-size:14px; color:#6b7280; }
.jd-spin { animation: jd-rotate 1s linear infinite; color: #6CB33F; }
@keyframes jd-rotate { to { transform: rotate(360deg); } }

.jd-wrap {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px 0;
}

/* topbar */
.jd-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 28px;
}
.jd-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #374151;
  background: rgba(255,255,255,.75); border: 1px solid rgba(0,0,0,.07);
  padding: 7px 16px; border-radius: 100px; text-decoration: none;
  backdrop-filter: blur(8px); transition: all .2s;
}
.jd-back:hover { background:#fff; box-shadow: 0 4px 12px rgba(0,0,0,.1); transform: translateX(-2px); }
.jd-top-actions { display: flex; align-items: center; gap: 8px; }

/* buttons */
.jd-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 100px; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all .2s; font-family: inherit;
}
.jd-btn:disabled { opacity:.5; cursor:not-allowed; }
.jd-btn-green {
  background: linear-gradient(135deg, #6CB33F, #4E8F2F);
  color: #fff; box-shadow: 0 4px 16px rgba(108,179,63,.35);
}
.jd-btn-green:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(108,179,63,.45); }
.jd-btn-blue {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: #fff; box-shadow: 0 4px 14px rgba(59,130,246,.3);
}
.jd-btn-blue:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(59,130,246,.4); }
.jd-btn-ghost {
  background: rgba(255,255,255,.7); color: #374151;
  border: 1.5px solid rgba(0,0,0,.09); backdrop-filter: blur(6px);
}
.jd-btn-ghost:hover:not(:disabled) { background:#fff; box-shadow:0 4px 12px rgba(0,0,0,.08); }
.jd-icon-btn { padding: 8px 10px; }

/* hero */
.jd-hero {
  position: relative;
  background: linear-gradient(135deg, #1a2f1a 0%, #1f3d1f 50%, #14532d 100%);
  border-radius: 28px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(20,83,45,.2), 0 4px 20px rgba(0,0,0,.15);
}
.jd-orb {
  position: absolute; border-radius: 50%;
  pointer-events: none; opacity: .18;
}
.jd-orb-1 {
  width: 380px; height: 380px;
  background: radial-gradient(circle, #6CB33F, transparent 70%);
  top: -120px; right: -80px;
}
.jd-orb-2 {
  width: 240px; height: 240px;
  background: radial-gradient(circle, #4ade80, transparent 70%);
  bottom: -60px; left: 60px;
}
.jd-hero-inner { position: relative; z-index: 1; padding: 40px 40px 36px; }

.jd-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
.jd-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 14px; border-radius: 100px;
  font-size: 11px; font-weight: 700; letter-spacing:.02em;
}
.jd-badge-green { background: rgba(108,179,63,.2); color: #86efac; border: 1px solid rgba(134,239,172,.25); }
.jd-badge-gray  { background: rgba(255,255,255,.1); color: #d1d5db; border: 1px solid rgba(255,255,255,.15); }

.jd-title {
  font-family: 'Sora', sans-serif;
  font-size: clamp(24px, 3.5vw, 38px);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 28px;
}

.jd-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
  gap: 10px;
}
.jd-meta-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 15px; border-radius: 14px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  backdrop-filter: blur(4px);
  transition: background .2s, transform .2s;
}
.jd-meta-card:hover { background: rgba(255,255,255,.12); transform: translateY(-1px); }
.jd-meta-icon-wrap { color: #86efac; margin-top: 1px; flex-shrink: 0; }
.jd-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing:.07em; color: rgba(255,255,255,.45); margin: 0; }
.jd-meta-value { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.9); margin: 2px 0 0; }

/* cards */
.jd-card {
  background: rgba(255,255,255,.82);
  border: 1px solid rgba(0,0,0,.07);
  border-radius: 24px;
  padding: 30px 34px;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 20px rgba(0,0,0,.05);
  animation: jd-up .4s ease both;
}
@keyframes jd-up {
  from { opacity:0; transform: translateY(16px); }
  to   { opacity:1; transform: translateY(0); }
}
.jd-desc-card { margin-bottom: 20px; }
.jd-section-head { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
.jd-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.jd-dot-dark  { background: #374151; }
.jd-dot-green { background: #6CB33F; }
.jd-dot-blue  { background: #3b82f6; }
.jd-section-title {
  font-size: 10px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .1em;
  color: #9ca3af; margin: 0;
}
.jd-desc {
  font-size: 15px; line-height: 1.85;
  color: #374151; white-space: pre-line; margin: 0;
}

.jd-skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.jd-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.jd-tag {
  display: inline-block; padding: 6px 14px; border-radius: 100px;
  font-size: 12px; font-weight: 700; transition: transform .15s;
}
.jd-tag:hover { transform: scale(1.06); }
.jd-tag-green { background: linear-gradient(135deg,#dcfce7,#bbf7d0); color:#15803d; border:1px solid rgba(21,128,61,.15); }
.jd-tag-blue  { background: linear-gradient(135deg,#dbeafe,#bfdbfe); color:#1d4ed8; border:1px solid rgba(29,78,216,.12); }

/* empty */
.jd-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; margin-top: 60px;
  background: #fff; border-radius: 24px;
  border: 2px dashed #d1fae5; padding: 64px 32px; text-align: center;
}
.jd-empty-icon { color: #9ca3af; }
.jd-empty-txt  { font-size: 16px; font-weight: 600; color: #6b7280; margin: 0; }

/* modal */
.jd-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,.5); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.jd-modal {
  background: #fff; border-radius: 28px; width: 100%; max-width: 460px;
  box-shadow: 0 32px 100px rgba(0,0,0,.25); overflow: hidden;
  animation: jd-up .3s ease;
}
.jd-modal-hd {
  padding: 28px 32px 20px;
  display: flex; align-items: flex-start; justify-content: space-between;
}
.jd-modal-title { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#111827; margin:0; }
.jd-modal-sub   { font-size:13px; color:#9ca3af; margin:4px 0 0; }
.jd-modal-x {
  width:34px; height:34px; border-radius:50%; border:none;
  background:#f3f4f6; color:#6b7280; cursor:pointer; font-size:13px;
}
.jd-modal-hr { border:none; border-top:1px solid #f3f4f6; margin:0; }
.jd-modal-body { padding:24px 32px 32px; display:flex; flex-direction:column; gap:14px; }
.jd-date-input {
  width:100%; padding:14px 18px; border-radius:14px;
  border:1.5px solid #e5e7eb; font-size:14px; color:#1f2937;
  outline:none; background:#fafafa; font-family:inherit;
  transition: border-color .2s, box-shadow .2s;
}
.jd-date-input:focus { border-color:#6CB33F; box-shadow:0 0 0 4px rgba(108,179,63,.12); }
.jd-modal-actions { display:flex; justify-content:flex-end; gap:10px; padding-top:4px; }

@media (max-width:640px) {
  .jd-skills-grid { grid-template-columns: 1fr; }
  .jd-hero-inner  { padding: 28px 22px 24px; }
  .jd-card        { padding: 22px 20px; }
  .jd-meta-grid   { grid-template-columns: repeat(2, 1fr); }
}
`;