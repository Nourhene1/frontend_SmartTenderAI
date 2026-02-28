"use client";
// app/recruiter/documents/page.jsx

import { useEffect, useState, useMemo } from "react";
import {
  generateResponseDocument,
  generateCandidateProfile,
  getDocumentHistory,
} from "../../services/document.api";
import { getTenders } from "../../services/tender.api";
import {
  FileDown, Loader2, CheckCircle2, AlertCircle,
  FileText, Users, ChevronDown, Download, Clock,
  Sparkles, Search, X, ArrowDownToLine,
} from "lucide-react";

/* ─── télécharger un blob ────────────────────────────────── */
function triggerDownload(data, filename) {
  try {
    const blob = data instanceof Blob
      ? data
      : new Blob([data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.style.display = "none";
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error("Download error:", err);
  }
}

/* ─── auth fetch ─────────────────────────────────────────── */
function authFetch(path) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const BASE  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
}

/* ─── helpers candidature ────────────────────────────────── */
function getCandName(c) {
  if (c.fullName) return c.fullName;
  const parsed = c.extracted?.parsed || c.extracted || {};
  const pi     = parsed.personal_info || parsed;
  const full   = pi.full_name || pi.nom || pi.name || "";
  const prenom = pi.prenom || c.prenom || "";
  const nom    = pi.nom    || c.nom    || "";
  return (full || [prenom, nom].filter(Boolean).join(" ")).trim() || "Candidat";
}
function getCandJob(c) {
  return c.extracted?.parsed?.titre_poste || c.extracted?.titre_poste || c.jobTitle || c.poste || "—";
}
function getCandEmail(c) {
  return c.email || c.extracted?.parsed?.personal_info?.email || c.extracted?.email || "";
}
function getCandScore(c) {
  return c.jobMatchResult?.score ?? c.matchScore ?? c.score ?? null;
}

/* ═══════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════ */
export default function DocumentsPage() {
  const [tenders,    setTenders]   = useState([]);
  const [allCands,   setAllCands]  = useState([]);
  const [history,    setHistory]   = useState([]);

  const [selectedTender,     setSelectedTender]     = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [candSearch,         setCandSearch]          = useState("");

  const [generating,    setGenerating]    = useState(false);
  const [genProfile,    setGenProfile]    = useState(null);
  const [loadingCands,  setLoadingCands]  = useState(true);
  const [toast,         setToast]         = useState(null);
  const [lastDoc,       setLastDoc]       = useState(null);
  const [downloadingId, setDownloadingId] = useState(null); // ✅ historique DL

  useEffect(() => {
    getTenders().then(r => setTenders(r.data || [])).catch(() => setTenders([]));

    authFetch("/candidatures/pre-interview")
      .then(data => {
        const list = Array.isArray(data) ? data : data?.candidatures || data?.data || [];
        setAllCands(list);
      })
      .catch(() => setAllCands([]))
      .finally(() => setLoadingCands(false));

    getDocumentHistory().then(r => setHistory(r.data || [])).catch(() => setHistory([]));
  }, []);

  const candidates = useMemo(() => {
    if (!candSearch) return allCands;
    const q = candSearch.toLowerCase();
    return allCands.filter(c =>
      getCandName(c).toLowerCase().includes(q) ||
      getCandJob(c).toLowerCase().includes(q)  ||
      getCandEmail(c).toLowerCase().includes(q)
    );
  }, [allCands, candSearch]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function toggleCandidate(id) {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }
  function selectAll() { setSelectedCandidates(candidates.map(c => c._id?.toString())); }
  function clearAll()  { setSelectedCandidates([]); }

  /* ── Générer dossier ──────────────────────────────────── */
  async function handleGenerateResponse() {
    if (!selectedTender)            return showToast("Sélectionne un tender", "error");
    if (!selectedCandidates.length) return showToast("Sélectionne au moins un candidat", "error");

    setGenerating(true);
    setLastDoc(null);

    try {
      const res    = await generateResponseDocument(selectedTender, selectedCandidates);
      const tender = tenders.find(t => t._id === selectedTender);
      const name   = (tender?.titre || "Reponse").replace(/[^a-zA-Z0-9 ]/g, "_").slice(0, 40);
      const filename = `Reponse_${name}.docx`;

      triggerDownload(res.data, filename);
      setLastDoc({ blob: res.data, filename });

      showToast("Dossier généré !");
      getDocumentHistory().then(r => setHistory(r.data || [])).catch(() => {});
    } catch (e) {
      console.error(e);
      showToast(e?.response?.data?.message || "Erreur lors de la génération", "error");
    } finally {
      setGenerating(false);
    }
  }

  /* ── Générer fiche profil ─────────────────────────────── */
  async function handleGenerateProfile(candidateId, candidateName) {
    setGenProfile(candidateId);
    try {
      const res  = await generateCandidateProfile(candidateId, selectedTender || null);
      const safe = (candidateName || "Profil").replace(/[^a-zA-Z0-9 ]/g, "_");
      triggerDownload(res.data, `Profil_${safe}.docx`);
      showToast("Fiche profil téléchargée !");
    } catch {
      showToast("Erreur génération profil", "error");
    } finally {
      setGenProfile(null);
    }
  }

  /* ── ✅ Télécharger depuis l'historique ───────────────── */
  async function handleDownloadHistory(item) {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const BASE  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const id    = item._id?.toString();

    setDownloadingId(id);
    try {
      const res = await fetch(`${BASE}/api/documents/${id}/download`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const tenderName = (item.tenderTitre || "Document")
        .toString().replace(/[^a-zA-Z0-9 ]/g, "_").slice(0, 40);
      const label    = item.type === "PROFILE" ? "Profil" : "Reponse";
      const date     = new Date(item.createdAt)
        .toLocaleDateString("fr-FR").replace(/\//g, "-");
      const filename = `${label}_${tenderName}_${date}.docx`;

      triggerDownload(blob, filename);
      showToast("Document téléchargé !");
    } catch (err) {
      console.error(err);
      showToast("Erreur téléchargement", "error");
    } finally {
      setDownloadingId(null);
    }
  }

  const selectedTenderData = tenders.find(t => t._id === selectedTender);

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "#ef4444" : "#6CB33F" }}>
          {toast.type === "error" ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
          {toast.msg}
        </div>
      )}

      <div style={S.wrap}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.pageTitle}>
            <Sparkles size={26} style={{ color:"#6CB33F" }}/> Document Generation
          </h1>
          <p style={S.pageSub}>Module 3 — Génération automatique de dossiers de réponse</p>
        </div>

        {/* Bannière re-téléchargement */}
        {lastDoc && (
          <div style={S.dlBanner}>
            <div style={S.dlBannerLeft}>
              <div style={S.dlBannerIcon}>
                <FileText size={18} style={{ color:"#6CB33F" }}/>
              </div>
              <div>
                <p style={S.dlBannerTitle}>Dossier prêt !</p>
                <p style={S.dlBannerSub}>{lastDoc.filename}</p>
              </div>
            </div>
            <button style={S.dlBannerBtn} className="dc-dl-btn"
              onClick={() => triggerDownload(lastDoc.blob, lastDoc.filename)}>
              <ArrowDownToLine size={15}/>
              Télécharger
            </button>
          </div>
        )}

        <div style={S.grid} className="dc-grid">

          {/* ════ Colonne gauche ════ */}
          <div style={S.left}>

            {/* 1. Tender */}
            <div style={S.card} className="dc-card">
              <div style={S.cardHead}>
                <FileText size={15} style={{ color:"#6CB33F" }}/>
                <span style={S.cardTitle}>1. Choisir un appel d&apos;offres</span>
              </div>

              <div style={S.selectWrap}>
                <select style={S.select} className="dc-select"
                  value={selectedTender}
                  onChange={e => { setSelectedTender(e.target.value); setLastDoc(null); }}>
                  <option value="">— Sélectionner un tender —</option>
                  {tenders.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.titre}{t.score_pertinence ? ` (${t.score_pertinence}%)` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={S.chevron}/>
              </div>

              {selectedTenderData && (
                <div style={S.tenderPreview}>
                  <p style={S.previewOrg}>{selectedTenderData.organisation || "Tender sélectionné"}</p>
                  <div style={S.tagsRow}>
                    {(selectedTenderData.keywords || []).slice(0, 5).map((k, i) => (
                      <span key={i} style={S.tagGreen}>{k}</span>
                    ))}
                  </div>
                  {selectedTenderData.deadline && (
                    <p style={S.previewMeta}><Clock size={11}/> Clôture : {selectedTenderData.deadline}</p>
                  )}
                </div>
              )}
            </div>

            {/* 2. Candidats */}
            <div style={S.card} className="dc-card">
              <div style={S.cardHead}>
                <Users size={15} style={{ color:"#6CB33F" }}/>
                <span style={S.cardTitle}>2. Sélectionner les candidats</span>
                {allCands.length > 0 && (
                  <span style={S.badge}>
                    {allCands.length} pré-sélectionné{allCands.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div style={S.searchRow}>
                <Search size={13} style={{ color:"#9ca3af", flexShrink:0 }}/>
                <input style={S.searchInput} placeholder="Rechercher un candidat…"
                  value={candSearch} onChange={e => setCandSearch(e.target.value)}/>
                {candSearch && (
                  <button style={S.clearBtn} onClick={() => setCandSearch("")}>
                    <X size={12}/>
                  </button>
                )}
              </div>

              {candidates.length > 0 && (
                <div style={S.bulkRow}>
                  <button style={S.bulkBtn} onClick={selectAll}>
                    Tout sélectionner ({candidates.length})
                  </button>
                  {selectedCandidates.length > 0 && (
                    <button style={{ ...S.bulkBtn, color:"#ef4444" }} onClick={clearAll}>
                      Tout désélectionner
                    </button>
                  )}
                </div>
              )}

              {loadingCands ? (
                <div style={S.center}><Loader2 size={20} className="dc-spin"/></div>
              ) : candidates.length === 0 ? (
                <p style={S.hint}>
                  {allCands.length === 0
                    ? "Aucun candidat pré-sélectionné dans l'application"
                    : "Aucun résultat"}
                </p>
              ) : (
                <div style={S.candList}>
                  {candidates.map(cand => {
                    const id      = cand._id?.toString();
                    const name    = getCandName(cand);
                    const job     = getCandJob(cand);
                    const score   = getCandScore(cand);
                    const checked = selectedCandidates.includes(id);

                    return (
                      <div key={id}
                        style={{ ...S.candRow,
                          background:  checked ? "rgba(108,179,63,.06)" : "transparent",
                          borderColor: checked ? "rgba(108,179,63,.3)"  : "rgba(0,0,0,.06)",
                        }}
                        className="dc-cand"
                        onClick={() => toggleCandidate(id)}
                      >
                        <div style={{ ...S.checkbox,
                          background:  checked ? "#6CB33F" : "#fff",
                          borderColor: checked ? "#6CB33F" : "#d1d5db",
                        }}>
                          {checked && <CheckCircle2 size={11} style={{ color:"#fff" }}/>}
                        </div>

                        <div style={{ ...S.avatar, background: checked ? "#dcfce7" : "#f3f4f6" }}>
                          <span style={{ fontSize:12, fontWeight:700, color: checked ? "#15803d" : "#6b7280" }}>
                            {name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={S.candName}>{name}</p>
                          <p style={S.candJob}>{job}</p>
                        </div>

                        {score != null && (
                          <span style={S.candScore}>{Math.round(score)}%</span>
                        )}

                        <button style={S.profileBtn} className="dc-profile-btn"
                          title="Télécharger fiche profil"
                          disabled={genProfile === id}
                          onClick={e => { e.stopPropagation(); handleGenerateProfile(id, name); }}
                        >
                          {genProfile === id
                            ? <Loader2 size={11} className="dc-spin"/>
                            : <ArrowDownToLine size={11}/>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bouton Générer */}
            <button style={S.genBtn} className="dc-gen-btn"
              disabled={generating || !selectedTender || !selectedCandidates.length}
              onClick={handleGenerateResponse}
            >
              {generating
                ? <><Loader2 size={15} className="dc-spin"/> Génération en cours…</>
                : <><FileDown size={15}/> Générer &amp; Télécharger le dossier</>
              }
            </button>

            {selectedCandidates.length > 0 && !generating && (
              <p style={S.selectedInfo}>
                <CheckCircle2 size={12} style={{ color:"#6CB33F" }}/>
                {selectedCandidates.length} candidat{selectedCandidates.length > 1 ? "s" : ""} sélectionné{selectedCandidates.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* ════ Colonne droite — Historique ════ */}
          <div style={S.right}>
            <div style={S.card} className="dc-card">
              <div style={S.cardHead}>
                <Clock size={15} style={{ color:"#6CB33F" }}/>
                <span style={S.cardTitle}>Historique des générations</span>
                {history.length > 0 && (
                  <span style={S.badge}>{history.length}</span>
                )}
              </div>

              {history.length === 0 ? (
                <div style={S.emptyHist}>
                  <Download size={28} style={{ color:"#d1d5db" }}/>
                  <p style={{ fontSize:13, color:"#9ca3af", margin:0, textAlign:"center" }}>
                    Aucun document généré pour l&apos;instant
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {history.slice(0, 20).map((h, i) => {
                    const hid        = h._id?.toString();
                    const isLoading  = downloadingId === hid;
                    const isResponse = h.type !== "PROFILE";

                    return (
                      <div key={hid || i} style={S.histRow} className="dc-hist-row">

                        {/* Icône type */}
                        <div style={{
                          ...S.histIcon,
                          background: isResponse ? "rgba(108,179,63,.1)" : "rgba(59,130,246,.1)",
                          color:      isResponse ? "#6CB33F"             : "#3b82f6",
                        }}>
                          {isResponse ? <FileText size={11}/> : <Users size={11}/>}
                        </div>

                        {/* Infos */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={S.histLabel}>
                            {isResponse ? "Dossier de réponse" : "Fiche profil"}
                          </p>
                          {h.tenderTitre && (
                            <p style={S.histTender}>{h.tenderTitre}</p>
                          )}
                          <p style={S.histDate}>
                            {new Date(h.createdAt).toLocaleDateString("fr-FR", {
                              day:"2-digit", month:"short",
                              hour:"2-digit", minute:"2-digit",
                            })}
                          </p>
                        </div>

                        {/* ✅ Bouton téléchargement */}
                        <button
                          style={{
                            ...S.histDlBtn,
                            opacity: isLoading ? 0.6 : 1,
                            cursor:  isLoading ? "not-allowed" : "pointer",
                          }}
                          className="dc-hist-dl"
                          disabled={isLoading}
                          title="Re-télécharger ce document"
                          onClick={() => handleDownloadHistory(h)}
                        >
                          {isLoading
                            ? <Loader2 size={13} className="dc-spin"/>
                            : <ArrowDownToLine size={13}/>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const S = {
  page:      { minHeight:"100vh", background:"linear-gradient(150deg,#f0fdf4 0%,#dcfce7 35%,#f8fff8 100%)", fontFamily:"'DM Sans',sans-serif", paddingBottom:80 },
  wrap:      { maxWidth:960, margin:"0 auto", padding:"32px 20px 0" },
  header:    { marginBottom:20 },
  pageTitle: { display:"flex", alignItems:"center", gap:10, fontSize:28, fontWeight:800, color:"#111827", margin:0, fontFamily:"'Sora',sans-serif", letterSpacing:"-0.03em" },
  pageSub:   { fontSize:13, color:"#6b7280", margin:"4px 0 0" },

  dlBanner:     { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"rgba(255,255,255,.95)", border:"2px solid rgba(108,179,63,.4)", borderRadius:18, padding:"14px 20px", marginBottom:20, boxShadow:"0 4px 20px rgba(108,179,63,.15)" },
  dlBannerLeft: { display:"flex", alignItems:"center", gap:12 },
  dlBannerIcon: { width:40, height:40, borderRadius:12, background:"rgba(108,179,63,.1)", display:"grid", placeItems:"center", flexShrink:0 },
  dlBannerTitle:{ fontSize:14, fontWeight:700, color:"#111827", margin:0 },
  dlBannerSub:  { fontSize:11, color:"#9ca3af", margin:"2px 0 0" },
  dlBannerBtn:  { display:"flex", alignItems:"center", gap:6, padding:"10px 18px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6CB33F,#4E8F2F)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0, fontFamily:"inherit", boxShadow:"0 4px 14px rgba(108,179,63,.35)" },

  grid:  { display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" },
  left:  { display:"flex", flexDirection:"column", gap:14 },
  right: { display:"flex", flexDirection:"column", gap:14 },

  card:     { background:"rgba(255,255,255,.85)", border:"1px solid rgba(0,0,0,.07)", borderRadius:22, padding:"20px 22px", backdropFilter:"blur(12px)", boxShadow:"0 2px 16px rgba(0,0,0,.05)" },
  cardHead: { display:"flex", alignItems:"center", gap:8, marginBottom:14 },
  cardTitle:{ fontSize:13, fontWeight:700, color:"#111827" },
  badge:    { marginLeft:"auto", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:100, background:"rgba(108,179,63,.1)", color:"#6CB33F" },

  selectWrap:{ position:"relative" },
  select:    { width:"100%", padding:"11px 36px 11px 13px", borderRadius:12, border:"1.5px solid #e5e7eb", fontSize:13, color:"#374151", outline:"none", appearance:"none", background:"#fafafa", fontFamily:"inherit", cursor:"pointer" },
  chevron:   { position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", pointerEvents:"none" },

  tenderPreview: { marginTop:12, padding:"11px 13px", background:"rgba(108,179,63,.06)", borderRadius:12, border:"1px solid rgba(108,179,63,.15)", display:"flex", flexDirection:"column", gap:5 },
  previewOrg:    { fontSize:10, fontWeight:700, color:"#6CB33F", margin:0, textTransform:"uppercase", letterSpacing:".07em" },
  tagsRow:       { display:"flex", flexWrap:"wrap", gap:4 },
  tagGreen:      { padding:"2px 8px", borderRadius:100, background:"linear-gradient(135deg,#dcfce7,#bbf7d0)", color:"#15803d", fontSize:11, fontWeight:700, border:"1px solid rgba(21,128,61,.15)" },
  previewMeta:   { display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6b7280", margin:0 },

  searchRow:   { display:"flex", alignItems:"center", gap:8, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:"8px 12px", marginBottom:10 },
  searchInput: { flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, color:"#374151", fontFamily:"inherit" },
  clearBtn:    { border:"none", background:"transparent", color:"#9ca3af", cursor:"pointer", display:"grid", placeItems:"center", padding:0 },
  bulkRow:     { display:"flex", gap:14, marginBottom:10 },
  bulkBtn:     { border:"none", background:"transparent", fontSize:11, fontWeight:700, color:"#6CB33F", cursor:"pointer", padding:0, fontFamily:"inherit" },

  hint:    { fontSize:13, color:"#9ca3af", margin:"8px 0" },
  center:  { display:"flex", justifyContent:"center", padding:20 },

  candList:  { display:"flex", flexDirection:"column", gap:7, maxHeight:400, overflowY:"auto", paddingRight:2 },
  candRow:   { display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:12, border:"1px solid", cursor:"pointer", transition:"all .15s" },
  checkbox:  { width:18, height:18, borderRadius:5, border:"1.5px solid", display:"grid", placeItems:"center", flexShrink:0, transition:"all .15s" },
  avatar:    { width:30, height:30, borderRadius:"50%", display:"grid", placeItems:"center", flexShrink:0, transition:"background .15s" },
  candName:  { fontSize:13, fontWeight:600, color:"#111827", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  candJob:   { fontSize:11, color:"#9ca3af", margin:"1px 0 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  candScore: { fontSize:12, fontWeight:800, color:"#6CB33F", flexShrink:0 },
  profileBtn:{ width:26, height:26, borderRadius:7, border:"1px solid rgba(108,179,63,.3)", background:"rgba(108,179,63,.08)", color:"#6CB33F", cursor:"pointer", display:"grid", placeItems:"center", transition:"all .15s", flexShrink:0 },

  genBtn:      { display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#6CB33F,#4E8F2F)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 20px rgba(108,179,63,.35)", transition:"all .2s", fontFamily:"inherit" },
  selectedInfo:{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#6b7280", margin:0, justifyContent:"center" },

  emptyHist:  { display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"28px 16px" },
  histRow:    { display:"flex", alignItems:"center", gap:10, padding:"9px 11px", borderRadius:10, background:"#f9fafb", border:"1px solid #f3f4f6", transition:"all .15s" },
  histIcon:   { width:26, height:26, borderRadius:7, display:"grid", placeItems:"center", flexShrink:0 },
  histLabel:  { fontSize:12, fontWeight:600, color:"#374151", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  histTender: { fontSize:11, color:"#6b7280", margin:"1px 0 0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  histDate:   { fontSize:11, color:"#9ca3af", margin:"2px 0 0" },
  histDlBtn:  { width:30, height:30, borderRadius:8, border:"1.5px solid rgba(108,179,63,.3)", background:"rgba(108,179,63,.08)", color:"#6CB33F", display:"grid", placeItems:"center", flexShrink:0, transition:"all .15s", fontFamily:"inherit" },

  toast: { position:"fixed", bottom:24, right:24, zIndex:999, display:"flex", alignItems:"center", gap:8, padding:"12px 20px", borderRadius:14, color:"#fff", fontSize:13, fontWeight:600, boxShadow:"0 8px 30px rgba(0,0,0,.2)" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
@keyframes dc-spin { to { transform:rotate(360deg); } }
@keyframes dc-up   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
.dc-spin { animation: dc-spin 1s linear infinite; }
.dc-card { transition: box-shadow .2s; }
.dc-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,.09)!important; }
.dc-gen-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(108,179,63,.45)!important; }
.dc-gen-btn:disabled { opacity:.5; cursor:not-allowed; }
.dc-cand:hover { background:rgba(108,179,63,.03)!important; }
.dc-select:focus { border-color:#6CB33F!important; }
.dc-profile-btn:hover:not(:disabled) { background:rgba(108,179,63,.2)!important; }
.dc-dl-btn:hover { filter: brightness(1.08); transform:translateY(-1px); }
.dc-hist-row:hover { background:#f0fdf4!important; border-color:rgba(108,179,63,.2)!important; }
.dc-hist-dl:hover:not(:disabled) { background:rgba(108,179,63,.2)!important; transform:translateY(-1px); box-shadow:0 2px 8px rgba(108,179,63,.2); }
@media(max-width:768px) { .dc-grid { grid-template-columns:1fr!important; } }
`;