"use client";
import { useEffect, useRef, useState } from "react";
import {
  analyzeTenderPDF,
  getTenders,
  deleteTender,
  updateTenderStatus,
  downloadBlob,
} from "../../services/tender.api";
import {
  Upload, FileText, Trash2, Loader2, Search,
  CheckCircle2, Archive, RefreshCw, ChevronRight,
  Zap, Target, AlertCircle, X, TrendingUp,
} from "lucide-react";

/* ── status config ─────────────────────────────────────── */
const STATUS = {
  DETECTED:  { label: "Détecté",   color: "#3b82f6", bg: "rgba(59,130,246,.12)",  border: "rgba(59,130,246,.25)"  },
  RESPONDED: { label: "Répondu",   color: "#6CB33F", bg: "rgba(108,179,63,.12)", border: "rgba(108,179,63,.25)" },
  ARCHIVED:  { label: "Archivé",   color: "#9ca3af", bg: "rgba(156,163,175,.1)",  border: "rgba(156,163,175,.2)"  },
};

function ScoreBadge({ score }) {
  const color = score >= 75 ? "#6CB33F" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:`2.5px solid ${color}`, display:"grid", placeItems:"center" }}>
        <span style={{ fontSize:10, fontWeight:800, color }}>{score}</span>
      </div>
    </div>
  );
}

/* ── Drawer détail ─────────────────────────────────────── */
function TenderDrawer({ tender, onClose, onStatusChange }) {
  if (!tender) return null;
  const reqs = tender.requirements || {};
  const allReqs = [...(reqs.technical||[]), ...(reqs.functional||[]), ...(reqs.experience||[])];

  return (
    <div style={styles.drawerOverlay} onMouseDown={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <div>
            <p style={styles.drawerOrg}>{tender.organisation || "Organisation"}</p>
            <h2 style={styles.drawerTitle}>{tender.titre}</h2>
          </div>
          <button style={styles.drawerClose} onClick={onClose}><X size={16}/></button>
        </div>

        <div style={styles.drawerBody}>
          {/* Score + meta */}
          <div style={styles.drawerMeta}>
            <div style={styles.metaBlock}>
              <p style={styles.metaL}>Score pertinence</p>
              <p style={{...styles.metaV, color:"#6CB33F", fontSize:28, fontWeight:800}}>{tender.score_pertinence ?? "—"}%</p>
            </div>
            {tender.deadline && <div style={styles.metaBlock}><p style={styles.metaL}>Deadline</p><p style={styles.metaV}>{tender.deadline}</p></div>}
            {tender.budget   && <div style={styles.metaBlock}><p style={styles.metaL}>Budget</p><p style={styles.metaV}>{tender.budget}</p></div>}
            {tender.secteur  && <div style={styles.metaBlock}><p style={styles.metaL}>Secteur</p><p style={styles.metaV}>{tender.secteur}</p></div>}
          </div>

          {/* Résumé */}
          {tender.resume && (
            <div style={styles.drawerSection}>
              <p style={styles.drawerSectionTitle}>Résumé</p>
              <p style={styles.drawerText}>{tender.resume}</p>
            </div>
          )}

          {/* Keywords */}
          {tender.keywords?.length > 0 && (
            <div style={styles.drawerSection}>
              <p style={styles.drawerSectionTitle}>Mots-clés extraits</p>
              <div style={styles.tagsWrap}>
                {tender.keywords.map((k,i) => (
                  <span key={i} style={styles.tagGreen}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {allReqs.length > 0 && (
            <div style={styles.drawerSection}>
              <p style={styles.drawerSectionTitle}>Exigences identifiées ({allReqs.length})</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {allReqs.map((r,i) => (
                  <div key={i} style={styles.reqRow}>
                    <CheckCircle2 size={13} style={{color:"#6CB33F", flexShrink:0}}/>
                    <span style={{fontSize:13, color:"#374151"}}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Justification score */}
          {tender.score_justification && (
            <div style={{...styles.drawerSection, background:"rgba(108,179,63,.06)", borderRadius:12, padding:14}}>
              <p style={styles.drawerSectionTitle}>Justification IA</p>
              <p style={styles.drawerText}>{tender.score_justification}</p>
            </div>
          )}

          {/* Change status */}
          <div style={styles.drawerSection}>
            <p style={styles.drawerSectionTitle}>Changer le statut</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Object.entries(STATUS).map(([s, cfg]) => (
                <button key={s}
                  style={{ padding:"7px 16px", borderRadius:100, border:`1.5px solid ${cfg.border}`,
                    background: tender.status === s ? cfg.bg : "transparent",
                    color: cfg.color, fontSize:12, fontWeight:700, cursor:"pointer" }}
                  onClick={() => onStatusChange(tender._id, s)}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ───────────────────────────────────── */
export default function TendersPage() {
  const [tenders, setTenders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [toast, setToast]           = useState(null);
  const fileRef = useRef();

  async function load() {
    try {
      const res = await getTenders();
      setTenders(res.data || []);
    } catch { setTenders([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleFile(file) {
    if (!file?.name?.toLowerCase().endsWith(".pdf")) {
      return showToast("Seuls les fichiers PDF sont acceptés", "error");
    }
    setUploading(true);
    try {
      await analyzeTenderPDF(file);
      showToast("Appel d'offres analysé avec succès !");
      await load();
    } catch (e) {
      showToast(e?.response?.data?.message || "Erreur lors de l'analyse", "error");
    } finally { setUploading(false); }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm("Supprimer ce tender ?")) return;
    try {
      await deleteTender(id);
      setTenders(t => t.filter(x => x._id !== id));
      if (selected?._id === id) setSelected(null);
      showToast("Tender supprimé");
    } catch { showToast("Erreur suppression", "error"); }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateTenderStatus(id, status);
      setTenders(t => t.map(x => x._id === id ? { ...x, status } : x));
      setSelected(s => s?._id === id ? { ...s, status } : s);
      showToast("Statut mis à jour");
    } catch { showToast("Erreur", "error"); }
  }

  const filtered = tenders.filter(t =>
    !search || t.titre?.toLowerCase().includes(search.toLowerCase()) ||
    t.organisation?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:     tenders.length,
    detected:  tenders.filter(t => t.status === "DETECTED").length,
    responded: tenders.filter(t => t.status === "RESPONDED").length,
    avgScore:  tenders.length ? Math.round(tenders.reduce((a,t) => a+(t.score_pertinence||0), 0) / tenders.length) : 0,
  };

  return (
    <div style={styles.page}>
      <style>{CSS}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#6CB33F" }}>
          {toast.type === "error" ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>}
          {toast.msg}
        </div>
      )}

      <div style={styles.wrap}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              <Target size={28} style={{ color:"#6CB33F" }}/> Tender Detection
            </h1>
            <p style={styles.pageSub}>Module 1 — Détection intelligente d'appels d'offres</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={styles.statsRow}>
          {[
            { label:"Total tenders",   value: stats.total,     icon: FileText,    color:"#6CB33F" },
            { label:"À traiter",        value: stats.detected,  icon: Zap,         color:"#3b82f6" },
            { label:"Répondus",         value: stats.responded, icon: CheckCircle2,color:"#22c55e" },
            { label:"Score moyen",      value: `${stats.avgScore}%`, icon: TrendingUp, color:"#f59e0b" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <div key={i} style={styles.statCard} className="td-card">
              <div style={{ ...styles.statIcon, background:`${color}18`, color }}>
                <Icon size={18}/>
              </div>
              <div>
                <p style={styles.statLabel}>{label}</p>
                <p style={{ ...styles.statValue, color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Drop zone upload ── */}
        <div
          style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}) }}
          className="td-drop"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display:"none" }}
            onChange={e => handleFile(e.target.files[0])} />

          {uploading ? (
            <div style={styles.dropContent}>
              <Loader2 size={36} style={{ color:"#6CB33F", animation:"td-spin 1s linear infinite" }}/>
              <p style={styles.dropTitle}>Analyse en cours par l'IA…</p>
              <p style={styles.dropSub}>Extraction des keywords, requirements et scoring</p>
            </div>
          ) : (
            <div style={styles.dropContent}>
              <div style={styles.dropIcon}>
                <Upload size={28} style={{ color:"#6CB33F" }}/>
              </div>
              <p style={styles.dropTitle}>Déposer un appel d'offres PDF</p>
              <p style={styles.dropSub}>ou cliquez pour sélectionner • PDF uniquement</p>
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div style={styles.searchWrap}>
          <Search size={15} style={{ color:"#9ca3af", flexShrink:0 }}/>
          <input
            style={styles.searchInput}
            placeholder="Rechercher un tender (titre, organisation)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* ── List ── */}
        {loading ? (
          <div style={styles.center}>
            <Loader2 size={28} style={{ color:"#6CB33F", animation:"td-spin 1s linear infinite" }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <FileText size={40} style={{ color:"#d1d5db" }}/>
            <p style={styles.emptyText}>
              {search ? "Aucun résultat" : "Aucun appel d'offres analysé"}
            </p>
            <p style={{ fontSize:13, color:"#9ca3af", margin:0 }}>
              Déposez un PDF ci-dessus pour commencer
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map((t, i) => {
              const st = STATUS[t.status] || STATUS.DETECTED;
              return (
                <div key={t._id} style={{ ...styles.card, animationDelay:`${i*0.05}s` }}
                  className="td-card td-clickable"
                  onClick={() => setSelected(t)}
                >
                  <div style={styles.cardLeft}>
                    <div style={styles.cardIdx}>{i + 1}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={styles.cardOrg}>{t.organisation || "—"}</div>
                      <h3 style={styles.cardTitle}>{t.titre}</h3>
                      <div style={styles.cardTags}>
                        {(t.keywords || []).slice(0, 4).map((k, j) => (
                          <span key={j} style={styles.tagBlue}>{k}</span>
                        ))}
                        {(t.keywords||[]).length > 4 && (
                          <span style={styles.tagGray}>+{t.keywords.length - 4}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.cardRight}>
                    <ScoreBadge score={t.score_pertinence ?? 0} />
                    <span style={{ ...styles.statusPill, color:st.color, background:st.bg, border:`1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                    <button style={styles.deleteBtn} className="td-del"
                      onClick={e => handleDelete(t._id, e)}>
                      <Trash2 size={14}/>
                    </button>
                    <ChevronRight size={16} style={{ color:"#d1d5db" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Drawer ── */}
      <TenderDrawer
        tender={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────── */
const styles = {
  page: { minHeight:"100vh", background:"linear-gradient(150deg,#f0fdf4 0%,#dcfce7 35%,#f8fff8 100%)", fontFamily:"'DM Sans',sans-serif", paddingBottom:80 },
  wrap: { maxWidth:900, margin:"0 auto", padding:"32px 20px 0" },

  header: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 },
  pageTitle: { display:"flex", alignItems:"center", gap:10, fontSize:28, fontWeight:800, color:"#111827", margin:0, fontFamily:"'Sora',sans-serif", letterSpacing:"-0.03em" },
  pageSub: { fontSize:13, color:"#6b7280", margin:"4px 0 0" },

  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 },
  statCard: { background:"rgba(255,255,255,.8)", border:"1px solid rgba(0,0,0,.07)", borderRadius:18, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, backdropFilter:"blur(8px)", boxShadow:"0 2px 12px rgba(0,0,0,.04)" },
  statIcon: { width:40, height:40, borderRadius:12, display:"grid", placeItems:"center", flexShrink:0 },
  statLabel: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af", margin:0 },
  statValue: { fontSize:22, fontWeight:800, margin:"2px 0 0", fontFamily:"'Sora',sans-serif" },

  dropZone: { background:"rgba(255,255,255,.75)", border:"2px dashed rgba(108,179,63,.4)", borderRadius:24, padding:"40px 24px", cursor:"pointer", transition:"all .2s", marginBottom:20, backdropFilter:"blur(8px)" },
  dropZoneActive: { background:"rgba(108,179,63,.06)", borderColor:"#6CB33F", transform:"scale(1.01)" },
  dropContent: { display:"flex", flexDirection:"column", alignItems:"center", gap:10 },
  dropIcon: { width:64, height:64, borderRadius:20, background:"rgba(108,179,63,.1)", display:"grid", placeItems:"center" },
  dropTitle: { fontSize:15, fontWeight:700, color:"#1f2937", margin:0 },
  dropSub: { fontSize:12, color:"#9ca3af", margin:0 },

  searchWrap: { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.8)", border:"1px solid rgba(0,0,0,.07)", borderRadius:14, padding:"12px 16px", marginBottom:16, backdropFilter:"blur(8px)" },
  searchInput: { border:"none", outline:"none", background:"transparent", fontSize:14, color:"#374151", width:"100%", fontFamily:"inherit" },

  list: { display:"flex", flexDirection:"column", gap:10 },
  card: { background:"rgba(255,255,255,.82)", border:"1px solid rgba(0,0,0,.07)", borderRadius:20, padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, backdropFilter:"blur(12px)", boxShadow:"0 2px 12px rgba(0,0,0,.04)", animation:"td-up .4s ease both", cursor:"pointer" },
  cardLeft: { display:"flex", alignItems:"flex-start", gap:14, minWidth:0, flex:1 },
  cardIdx: { width:30, height:30, borderRadius:"50%", background:"rgba(108,179,63,.1)", color:"#6CB33F", fontSize:11, fontWeight:800, display:"grid", placeItems:"center", flexShrink:0 },
  cardOrg: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af", marginBottom:3 },
  cardTitle: { fontSize:14, fontWeight:700, color:"#111827", margin:"0 0 6px", lineHeight:1.3 },
  cardTags: { display:"flex", flexWrap:"wrap", gap:4 },
  cardRight: { display:"flex", alignItems:"center", gap:10, flexShrink:0 },

  tagGreen: { display:"inline-block", padding:"4px 10px", borderRadius:100, background:"linear-gradient(135deg,#dcfce7,#bbf7d0)", color:"#15803d", fontSize:11, fontWeight:700, border:"1px solid rgba(21,128,61,.15)" },
  tagBlue:  { display:"inline-block", padding:"3px 9px", borderRadius:100, background:"rgba(59,130,246,.08)", color:"#1d4ed8", fontSize:11, fontWeight:600, border:"1px solid rgba(59,130,246,.15)" },
  tagGray:  { display:"inline-block", padding:"3px 9px", borderRadius:100, background:"rgba(107,114,128,.08)", color:"#6b7280", fontSize:11, fontWeight:600 },
  statusPill: { padding:"4px 12px", borderRadius:100, fontSize:11, fontWeight:700 },
  deleteBtn: { width:30, height:30, borderRadius:"50%", border:"1px solid #fee2e2", background:"#fff5f5", color:"#ef4444", cursor:"pointer", display:"grid", placeItems:"center", transition:"all .15s" },

  center: { display:"flex", justifyContent:"center", padding:60 },
  empty: { display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"60px 32px", background:"rgba(255,255,255,.7)", borderRadius:24, border:"2px dashed #d1fae5", textAlign:"center" },
  emptyText: { fontSize:16, fontWeight:600, color:"#6b7280", margin:0 },

  toast: { position:"fixed", bottom:24, right:24, zIndex:999, display:"flex", alignItems:"center", gap:8, padding:"12px 20px", borderRadius:14, color:"#fff", fontSize:13, fontWeight:600, boxShadow:"0 8px 30px rgba(0,0,0,.2)", animation:"td-up .3s ease" },

  /* Drawer */
  drawerOverlay: { position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.4)", backdropFilter:"blur(4px)", display:"flex", justifyContent:"flex-end" },
  drawer: { width:"100%", maxWidth:520, background:"#fff", height:"100vh", overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,.15)", display:"flex", flexDirection:"column" },
  drawerHeader: { padding:"28px 28px 20px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", borderBottom:"1px solid #f3f4f6", position:"sticky", top:0, background:"#fff", zIndex:1 },
  drawerClose: { width:32, height:32, borderRadius:"50%", border:"none", background:"#f3f4f6", color:"#6b7280", cursor:"pointer", display:"grid", placeItems:"center", flexShrink:0 },
  drawerOrg: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#6CB33F", margin:0 },
  drawerTitle: { fontSize:18, fontWeight:800, color:"#111827", margin:"4px 0 0", fontFamily:"'Sora',sans-serif", lineHeight:1.3 },
  drawerBody: { padding:"24px 28px", display:"flex", flexDirection:"column", gap:20, flex:1 },
  drawerMeta: { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 },
  metaBlock: { background:"#f9fafb", borderRadius:12, padding:"12px 14px" },
  metaL: { fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9ca3af", margin:0 },
  metaV: { fontSize:14, fontWeight:700, color:"#111827", margin:"4px 0 0" },
  drawerSection: { display:"flex", flexDirection:"column", gap:8 },
  drawerSectionTitle: { fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:".08em", color:"#6b7280", margin:0 },
  drawerText: { fontSize:13, lineHeight:1.7, color:"#374151", margin:0 },
  tagsWrap: { display:"flex", flexWrap:"wrap", gap:6 },
  reqRow: { display:"flex", alignItems:"flex-start", gap:8 },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
@keyframes td-spin { to { transform:rotate(360deg); } }
@keyframes td-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.td-card { transition: transform .2s, box-shadow .2s; }
.td-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
.td-clickable:active { transform:scale(.99); }
.td-del:hover { background:#fee2e2!important; transform:scale(1.1); }
.td-drop:hover { border-color:#6CB33F!important; background:rgba(108,179,63,.04)!important; }
@media(max-width:640px){ .td-stats { grid-template-columns:repeat(2,1fr)!important; } }
`;