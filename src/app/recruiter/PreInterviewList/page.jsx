"use client";

import { useEffect, useState, useMemo } from "react";
import { getPreInterviewList, sendDocuments } from "../../services/candidature.api";
import { getQuizByJob } from "../../services/quiz.api";
import api from "../../services/api";
import Link from "next/link";

import {
  UserCheck,
  FileText,
  Search,
  Calendar,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Briefcase,
  Send,
  X,
  CheckCircle2,
  Brain,
  ClipboardList,
  AlertCircle,
  Loader2,
  BarChart2,
  PhoneCall,
  Users,
  UserCog,
  Star,
  ChevronRight,
  StickyNote,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ================= HELPERS ================= */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v.trim() : String(v).trim();
}
function pct(score) {
  if (typeof score !== "number") return "—";
  const val = score > 1 ? score : score * 100;
  return `${Math.round(val)}%`;
}
function getName(c) {
  const f = safeStr(c?.fullName);
  if (f) return f;
  const b = `${safeStr(c?.prenom)} ${safeStr(c?.nom)}`.trim();
  return b || safeStr(c?.email) || "Candidat";
}
function getCvUrl(c) {
  const u = safeStr(c?.cv?.fileUrl);
  if (!u) return null;
  if (u.startsWith("http")) return u;
  return `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}
function getCvName(c) {
  return safeStr(c?.cv?.originalName) || "CV.pdf";
}
function getMatchScore(c) {
  const j = c?.analysis?.jobMatch;
  if (!j) return null;
  const s = j?.score?.score ?? j?.score ?? null;
  if (typeof s !== "number") return null;
  return s > 1 ? s / 100 : s;
}
function scoreBg(s) {
  if (s === null) return "bg-gray-100 text-gray-500";
  if (s >= 0.75) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (s >= 0.45) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── localStorage pour persister "envoyé" entre refreshes ──
function markSentFiche(id) {
  try {
    localStorage.setItem(`fiche_sent_${id}`, "1");
  } catch {}
}
function wasSentFiche(id) {
  try {
    return localStorage.getItem(`fiche_sent_${id}`) === "1";
  } catch {
    return false;
  }
}

function markSentQuiz(id) {
  try {
    localStorage.setItem(`quiz_sent_${id}`, "1");
  } catch {}
}
function wasSentQuiz(id) {
  try {
    return localStorage.getItem(`quiz_sent_${id}`) === "1";
  } catch {
    return false;
  }
}

function markSent(id) {
  try {
    localStorage.setItem(`docs_sent_${id}`, "1");
  } catch {}
}
function wasSent(id) {
  try {
    return localStorage.getItem(`docs_sent_${id}`) === "1";
  } catch {
    return false;
  }
}

/* ================================================================
   MODAL — Envoyer Fiche + Quiz
================================================================ */
function SendDocumentsModal({ candidature, onClose, onSuccess, initialSentFiche = false, initialSentQuiz = false }) {
  const [fiches, setFiches] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedFicheId, setSelectedFicheId] = useState("");
  const [includeQuiz, setIncludeQuiz] = useState(false);
  const [email, setEmail] = useState(safeStr(candidature?.email));
  const [sending, setSending] = useState(false);
  const [sentFiche, setSentFiche] = useState(initialSentFiche);
  const [sentQuiz, setSentQuiz] = useState(initialSentQuiz);
  const [error, setError] = useState("");
  const name = getName(candidature);

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const fr = await api.get("/fiches");
        setFiches(Array.isArray(fr?.data) ? fr.data : []);
        const jid = candidature?.jobOfferId;
        if (jid) {
          try {
            const qr = await getQuizByJob(jid.toString());
            const q = qr?.data || null;
            setQuiz(q);
            if (q && !initialSentQuiz) setIncludeQuiz(true);
          } catch {
            setQuiz(null);
          }
        }
      } catch (e) {
        console.error("Erreur chargement modal:", e?.message);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [candidature, initialSentQuiz]);

  const canSend = email.trim() && (selectedFicheId || includeQuiz) && !sending && !(sentFiche && sentQuiz);
  const allSent = sentFiche && sentQuiz;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      const res = await sendDocuments(candidature._id, {
        ficheId: selectedFicheId || undefined,
        includeQuiz,
        email: email.trim(),
      });
      
      let justSentFiche = false;
      let justSentQuiz = false;
      
      if (res.data?.sentFiche && !sentFiche) {
        setSentFiche(true);
        justSentFiche = true;
      }
      if (res.data?.sentQuiz && !sentQuiz) {
        setSentQuiz(true);
        justSentQuiz = true;
      }
      
      onSuccess?.(justSentFiche, justSentQuiz);
    } catch (e) {
      setError(e?.response?.data?.message || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-green-50/60 dark:bg-green-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Envoyer des documents
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                à <span className="font-semibold text-gray-700 dark:text-gray-300">{name}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {allSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Tout envoyé !</h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {sentFiche && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <ClipboardList className="w-4 h-4" /> Fiche envoyée
                  </span>
                )}
                {sentQuiz && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <Brain className="w-4 h-4" /> Quiz envoyé
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Email envoyé à <strong>{email}</strong>
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : loadingData ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement des données...</span>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Email du candidat
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidat@email.com"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Quiz */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Brain className="w-4 h-4 inline mr-1.5 text-green-600" />
                  Quiz technique
                </p>

                {quiz ? (
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      sentQuiz
                        ? "border-green-500 bg-green-50/60 dark:bg-green-900/20 opacity-60 cursor-not-allowed"
                        : includeQuiz
                        ? "border-green-500 bg-green-50/60 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={includeQuiz}
                      onChange={(e) => setIncludeQuiz(e.target.checked)}
                      disabled={sentQuiz}
                      className="mt-0.5 accent-green-600 w-4 h-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {quiz.jobTitle || "Quiz technique"}
                        </p>
                        {sentQuiz && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Envoyé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {quiz.totalQuestions || 0} questions · ~{Math.ceil((quiz.totalQuestions || 0) * 2)} min
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Aucun quiz disponible pour ce poste
                  </div>
                )}
              </div>

              {/* Fiches */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-1.5 text-green-600" />
                  Fiche de renseignement
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      !selectedFicheId
                        ? "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fiche"
                      value=""
                      checked={!selectedFicheId}
                      onChange={() => setSelectedFicheId("")}
                      disabled={sentFiche}
                      className="w-4 h-4 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ne pas envoyer de fiche</span>
                  </label>

                  {fiches.map((f) => (
                    <label
                      key={f._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        sentFiche
                          ? "border-green-500 bg-green-50/60 dark:bg-green-900/20 opacity-60 cursor-not-allowed"
                          : selectedFicheId === f._id
                          ? "border-green-500 bg-green-50/60 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="fiche"
                        value={f._id}
                        checked={selectedFicheId === f._id}
                        onChange={() => setSelectedFicheId(f._id)}
                        disabled={sentFiche}
                        className="mt-0.5 accent-green-600 w-4 h-4 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{f.title}</p>
                          {sentFiche && selectedFicheId === f._id && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Envoyée
                            </span>
                          )}
                        </div>
                        {f.description && <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{f.questions?.length || 0} questions</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Résumé */}
              {(selectedFicheId || includeQuiz) && !allSent && (
                <div className="bg-green-50/60 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 text-sm text-green-700 dark:text-green-300">
                  Sera envoyé :{" "}
                  {[includeQuiz && !sentQuiz && "Quiz technique", selectedFicheId && !sentFiche && "Fiche de renseignement"]
                    .filter(Boolean)
                    .join(" + ")}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Envoi en cours..." : "Envoyer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MODAL — Planifier Entretien (3 flows)
================================================================ */

// ── Flow 1: Téléphonique — note CRUD ──────────────────────────
function TelephoniqueFlow({ candidate, onBack }) {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setLoading(true);
    try {
      const r = await api.get(`/candidatures/${candidate._id}/entretien-notes`);
      const normalized = (r.data || [])
        .map((n) => {
          const id =
            n.noteId ||
            n._id?.$oid ||
            (typeof n._id === "string" ? n._id : null) ||
            n.id ||
            null;
          if (!id) return null;
          return { ...n, noteId: String(id) };
        })
        .filter(Boolean);
      setNotes(normalized);
    } catch (e) {
      console.error("fetchNotes error:", e);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await api.patch(
          `/candidatures/${candidate._id}/entretien-note/${editId}`,
          { note: noteText.trim() }
        );
      } else {
        await api.post(
          `/candidatures/${candidate._id}/entretien-note`,
          { type: "telephonique", note: noteText.trim() }
        );
      }
      setNoteText("");
      setEditId(null);
      await fetchNotes();
    } catch (e) {
      console.error("saveNote error:", e?.response?.status, e?.response?.data);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(noteId) {
    if (!noteId) return;
    if (!confirm("Supprimer cette note ?")) return;
    try {
      await api.delete(`/candidatures/${candidate._id}/entretien-note/${noteId}`);
      await fetchNotes();
    } catch (e) {
      console.error("deleteNote error:", e?.response?.status, e?.response?.data);
    }
  }

  function startEdit(n) {
    const id = n._id?.$oid || n._id?.toString?.() || String(n._id || "");
    setEditId(id);
    setNoteText(n.note);
  }

  return (
    <div className="p-5">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4">
        ← Retour
      </button>

      <div className="flex items-center gap-3 mb-5 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <PhoneCall className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Entretien Téléphonique</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder={editId ? "Modifier la note..." : "Ajouter une note après l'entretien téléphonique..."}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <button
          onClick={saveNote}
          disabled={!noteText.trim() || saving}
          className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <StickyNote className="w-4 h-4" />}
          {editId ? "Modifier" : "Sauvegarder"}
        </button>

        {editId && (
          <button
            onClick={() => {
              setEditId(null);
              setNoteText("");
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Annuler
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-green-400" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-3">Aucune note enregistrée</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {notes.map((n, i) => (
            <div key={n._id || i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{n.note}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</span>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(n)} className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNote(n.noteId || n._id?.$oid || n._id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flow 2: Entretien RH ──────────────────────────
function RHFlow({ candidate, onBack, onClose }) {
  const name =
    candidate?.fullName || `${candidate?.prenom || ""} ${candidate?.nom || ""}`.trim() || "Candidat";
  const email = candidate?.email || "";
  const jobTitle = candidate?.jobTitle || "";
  const candidId = candidate?._id || "";

  function openCalendar() {
    const params = new URLSearchParams({
      newEvent: "1",
      type: "entretien_rh",
      candidateName: name,
      candidateEmail: email,
      jobTitle,
      candidatureId: candidId,
    });
    onClose();
    window.location.href = `/recruiter/calendar?${params.toString()}`;
  }

  return (
    <div className="p-5">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4">
        ← Retour
      </button>

      <div className="flex items-center gap-3 mb-6 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Entretien RH</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Planifier depuis votre calendrier Outlook</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm flex-shrink-0">
            {name?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{name}</p>
            {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
          </div>
        </div>
        {jobTitle && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pl-10">
            <Briefcase className="w-3 h-3" />
            <span className="truncate">{jobTitle}</span>
          </div>
        )}
      </div>

      <div className="mb-6 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
          Vous allez être redirigé vers votre <strong>calendrier Outlook</strong> pour créer l&apos;événement directement.
          <span className="mt-1 block text-green-700/70 dark:text-green-300/70">
            Le formulaire sera pré-rempli avec les informations du candidat. Une fois l&apos;entretien créé, un email sera envoyé automatiquement.
          </span>
        </p>
      </div>

      <button
        onClick={openCalendar}
        className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4" />
        Ouvrir le calendrier &amp; Créer l&apos;entretien
      </button>
    </div>
  );
}

// ── Flow 3: RH + Technique ──────────────────────────
function RHTechniqueFlow({ candidate, onBack, onClose }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAvailability();
  }, [candidate?._id, candidate?.jobOfferId]);

  async function fetchAvailability() {
    setLoading(true);
    setError("");
    setSelected(null);
    setDone(false);

    try {
      const candidatureId = candidate?._id;
      const jobOfferId = candidate?.jobOfferId;

      if (!candidatureId || !jobOfferId) {
        setSlots([]);
        setError("Candidature/jobOfferId manquant.");
        setLoading(false);
        return;
      }

      const r = await api.get("/api/calendar/rh-tech-slots", {
        params: { candidatureId, jobOfferId, days: 7 },
      });

      const got = r?.data?.slots || [];
      setSlots(Array.isArray(got) ? got : []);
    } catch (e) {
      console.error(e);
      setSlots([]);
      setError(e?.response?.data?.message || e?.message || "Erreur lors du chargement des créneaux");
    }

    setLoading(false);
  }

  async function handleSchedule() {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      const candidatureId = candidate?._id;
      const jobOfferId = candidate?.jobOfferId;

      if (!candidatureId || !jobOfferId) {
        setError("Candidature/jobOfferId manquant.");
        setSaving(false);
        return;
      }

      await api.post("/api/calendar/rh-tech/schedule", {
        candidatureId,
        jobOfferId,
        proposedDate: selected.date,
        proposedTime: selected.time,
      });

      setDone(true);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || "Erreur");
    }

    setSaving(false);
  }

  const slotsByDay = useMemo(() => {
    const acc = {};
    for (const s of slots) {
      const day = s?.date;
      if (!day) continue;
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
    }
    Object.keys(acc).forEach((day) => {
      acc[day].sort((a, b) => String(a.time).localeCompare(String(b.time)));
    });
    return acc;
  }, [slots]);

  if (done) {
    return (
      <div className="p-5 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">Demande envoyée !</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Email envoyé au Responsable Métier pour confirmation.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          S&apos;il accepte → email automatique au candidat avec les détails.
        </p>

        <button
          onClick={onClose}
          className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 mb-4">
        ← Retour
      </button>

      <div className="flex items-center gap-3 mb-4 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
        <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <UserCog className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-white">Entretien RH + Technique</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Créneaux libres — Recruteur & Responsable (7 jours)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-green-400" />
          <p className="text-sm text-gray-400">Analyse des calendriers...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Aucun créneau commun trouvé cette semaine.</p>
          <button onClick={fetchAvailability} className="text-xs text-green-600 hover:underline">
            Réessayer
          </button>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-3 mb-4 pr-1">
          {Object.entries(slotsByDay).map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {new Date(day).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>

              <div className="flex flex-wrap gap-2">
                {daySlots.map((s, i) => {
                  const active = selected?.date === s.date && selected?.time === s.time;
                  return (
                    <button
                      key={`${day}-${s.time}-${i}`}
                      onClick={() => setSelected(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${
                        active
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-green-400 dark:hover:border-green-700"
                      }`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mb-3 p-3 bg-green-50/60 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Créneau sélectionné</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {new Date(selected.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à{" "}
              {selected.time}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleSchedule}
        disabled={!selected || saving}
        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {saving ? "Envoi..." : "Envoyer au Responsable pour confirmation"}
      </button>
    </div>
  );
}

// ── Wrapper Modal principal ─────────────────────────────────────
function EntretienModal({ candidate, onClose, onRHScheduled }) {
  const [step, setStep] = useState("type");
  const name = getName(candidate);

  const types = [
    { id: "telephonique", label: "Entretien Téléphonique", icon: PhoneCall, desc: "Note et suivi après appel" },
    { id: "rh", label: "Entretien RH", icon: Users, desc: "Planifier + email candidat" },
    { id: "rh_technique", label: "Entretien RH + Technique", icon: UserCog, desc: "Créneaux libres communs" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-5 bg-green-50/60 dark:bg-green-900/10 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-gray-900 dark:text-white font-extrabold text-lg truncate">Planifier un entretien</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">{name}</p>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-white/70 dark:hover:bg-gray-800 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {step === "type" && (
          <div className="p-5 space-y-3">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setStep(t.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50/60 dark:hover:bg-green-900/10 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <t.icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 dark:text-white text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {step === "telephonique" && <TelephoniqueFlow candidate={candidate} onBack={() => setStep("type")} onClose={onClose} />}
        {step === "rh" && (
          <RHFlow
            candidate={candidate}
            onBack={() => setStep("type")}
            onClose={onClose}
            onScheduled={onRHScheduled}
          />
        )}
        {step === "rh_technique" && <RHTechniqueFlow candidate={candidate} onBack={() => setStep("type")} onClose={onClose} />}
      </div>
    </div>
  );
}

function NoteStars({ note }) {
  const [stars, setStars] = useState(0);
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appréciation :</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setStars(s)}>
            <Star
              className={`w-5 h-5 transition-colors ${
                s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PreInterviewCard({ c, index }) {
  const [sentFiche, setSentFiche] = useState(() => wasSentFiche(c._id));
  const [sentQuiz, setSentQuiz] = useState(() => wasSentQuiz(c._id));
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEntretienModal, setShowEntretienModal] = useState(false);
  const [rhInterview, setRhInterview] = useState(c?.latestRhInterview || null);

  const name = getName(c);
  const cvUrl = getCvUrl(c);
  const cvName = getCvName(c);
  const score = getMatchScore(c);
  const jobTitle = safeStr(c?.jobTitle) || "—";
  const email = safeStr(c?.email);
  const selectedAt = c?.preInterview?.selectedAt;

  const allSent = sentFiche && sentQuiz;
  const anySent = sentFiche || sentQuiz;

  // Sauvegarder quand l'état change
  useEffect(() => {
    if (sentFiche) {
      markSentFiche(c._id);
    }
  }, [sentFiche, c._id]);

  useEffect(() => {
    if (sentQuiz) {
      markSentQuiz(c._id);
    }
  }, [sentQuiz, c._id]);

  // Sauvegarder dans localStorage global quand les deux sont envoyés
  useEffect(() => {
    if (allSent) {
      markSent(c._id);
    }
  }, [allSent, c._id]);

  // Déterminer l'état du bouton
  function getButtonState() {
    if (allSent) {
      return {
        label: "Documents envoyés",
        disabled: true,
        badges: []
      };
    }
    
    if (sentFiche && !sentQuiz) {
      return {
        label: "Envoyer Quiz",
        disabled: false,
        badges: [
          <span key="fiche" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"><ClipboardList className="w-4 h-4" /> Fiche ✓</span>
        ]
      };
    }
    
    if (sentQuiz && !sentFiche) {
      return {
        label: "Envoyer Fiche",
        disabled: false,
        badges: [
          <span key="quiz" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"><Brain className="w-4 h-4" /> Quiz ✓</span>
        ]
      };
    }
    
    return {
      label: "Envoyer (fiche / quiz)",
      disabled: false,
      badges: []
    };
  }

  const buttonState = getButtonState();

  function handleModalSuccess(justSentFiche, justSentQuiz) {
    if (justSentFiche) setSentFiche(true);
    if (justSentQuiz) setSentQuiz(true);
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6">
          {/* TOP CONTENT — responsive */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* LEFT */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-300 font-extrabold text-2xl">
                  {name?.[0]?.toUpperCase() || "C"}
                </div>
                <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-green-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              {/* Infos */}
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white truncate">{name}</h2>

                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{jobTitle}</p>
                </div>

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {email}
                  </a>
                )}

                {cvUrl && (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-base font-semibold text-green-700 dark:text-emerald-400 hover:text-green-800"
                  >
                    <FileText className="w-5 h-5" />
                    Voir CV <span className="text-gray-400 text-sm font-normal">({cvName})</span>
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT (score + date) */}
            <div className="w-full md:w-[320px] shrink-0 flex flex-row md:flex-col items-start md:items-end justify-between md:justify-start gap-4">
              <div className="text-left md:text-right">
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Match score</p>
                <div className={`inline-flex text-3xl font-extrabold px-5 py-2 rounded-2xl ${scoreBg(score)}`}>{pct(score)}</div>
                <button className="block mt-2 md:ml-auto text-sm text-gray-400 hover:text-red-500 transition-colors">
                  Reject
                </button>
              </div>

              {selectedAt && (
                <div className="inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4" />
                  Sélectionné le {formatDate(selectedAt)}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {/* Envoyer — état dynamique */}
            {allSent ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-semibold cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4" />
                {buttonState.label}
                {buttonState.badges.length > 0 && (
                  <div className="flex gap-1.5">
                    {buttonState.badges}
                  </div>
                )}
              </div>
            ) : anySent ? (
              <>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition"
                >
                  <Send className="w-4 h-4" />
                  {buttonState.label}
                </button>
                {buttonState.badges.length > 0 && (
                  <div className="flex gap-1.5">
                    {buttonState.badges}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => setShowSendModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
              >
                <Send className="w-4 h-4" />
                {buttonState.label}
              </button>
            )}

            {/* Planifier */}
            <button
              onClick={() => setShowEntretienModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              <Calendar className="w-4 h-4" />
              Planifier entretien
            </button>

            {/* Résultats */}
            <Link
              href={`/recruiter/PreInterviewList/${c._id}/results`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-semibold transition"
            >
              <BarChart2 className="w-4 h-4" />
              Résultats
            </Link>
          </div>
        </div>
      </div>

      {/* Modal envoi */}
      {showSendModal && (
        <SendDocumentsModal 
          candidature={c} 
          onClose={() => setShowSendModal(false)} 
          onSuccess={(justSentFiche, justSentQuiz) => handleModalSuccess(justSentFiche, justSentQuiz)}
          initialSentFiche={sentFiche}
          initialSentQuiz={sentQuiz}
        />
      )}

      {showEntretienModal && (
        <EntretienModal
          candidate={c}
          onClose={() => setShowEntretienModal(false)}
          onRHScheduled={(iv) => {
            setRhInterview(iv);
            setShowEntretienModal(false);
          }}
        />
      )}
    </>
  );
}

/* ================================================================
   PAGE PRINCIPALE
================================================================ */
export default function PreInterviewListPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await getPreInterviewList();
        setCandidates(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        console.error("Erreur chargement pré-entretien:", e?.message);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const n = getName(c).toLowerCase();
      const e = safeStr(c?.email).toLowerCase();
      const j = safeStr(c?.jobTitle).toLowerCase();
      return n.includes(q) || e.includes(q) || j.includes(q);
    });
  }, [candidates, search]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              Candidats Pré-sélectionnés
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {candidates.length} candidat{candidates.length > 1 ? "s" : ""} prêt{candidates.length > 1 ? "s" : ""} pour entretien
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un candidat (nom, email, job)..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-400 transition-colors"
          />
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? "Aucun candidat trouvé" : "Aucun candidat pré-sélectionné"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c, i) => (
              <PreInterviewCard key={c._id} c={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}