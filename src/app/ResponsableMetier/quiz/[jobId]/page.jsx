"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getQuizByJob,
  generateQuiz,
  regenerateQuiz,
  generateMoreQuestions,
  addQuestion,
  deleteQuestion,
  updateQuestion,
} from "../../../services/quiz.api";

import {
  Loader2,
  AlertCircle,
  Zap,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  ChevronUp,
  Sparkles,
  X,
  Pencil,
  Save,
} from "lucide-react";

/* ── Timer par difficulté (en secondes) ── */
const TIMER_BY_DIFFICULTY = { easy: 20, medium: 40, hard: 60 };

const DIFFICULTY_LABELS = {
  easy: {
    label: "Facile",
    color:
      "bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border dark:border-emerald-500/25",
  },
  medium: {
    label: "Moyen",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border dark:border-yellow-500/25",
  },
  hard: {
    label: "Difficile",
    color:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 dark:border dark:border-red-500/25",
  },
};

const CATEGORY_LABELS = {
  skillsFit: "Compétences",
  experienceFit: "Expérience",
  projectsFit: "Projets",
  educationFit: "Théorie",
  communicationFit: "Communication",
};

const EMPTY_FORM = {
  question: "",
  category: "skillsFit",
  difficulty: "medium",
  timeLimit: "", // optionnel
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctAnswer: "A",
  explanation: "",
};

function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function getQuestionSeconds(q) {
  const raw =
    q?.timeLimit ??
    q?.duration ??
    q?.durationSec ??
    q?.seconds ??
    q?.timeSeconds ??
    null;

  if (raw === null || raw === undefined) {
    const d = safeStr(q?.difficulty || "medium");
    return TIMER_BY_DIFFICULTY[d] || 40;
  }

  if (typeof raw === "number") return raw;

  const s = safeStr(raw).toLowerCase();

  if (s.includes(":")) {
    const parts = s.split(":").map((p) => Number(p));
    if (parts.some((n) => !Number.isFinite(n))) return 40;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  const n = Number(s.replace("s", ""));
  return Number.isFinite(n) && n > 0 ? n : 40;
}

function totalDurationMinutes(questions) {
  const sumSec = (questions || []).reduce(
    (acc, q) => acc + (getQuestionSeconds(q) || 0),
    0
  );
  return Math.max(1, Math.round(sumSec / 60));
}

/* ── Modal Confirm Delete Question ── */
function ConfirmModal({ open, title, subtitle, loading, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65"
        onClick={loading ? undefined : onClose}
      />
      <div
        className="
          relative w-[92%] max-w-md rounded-2xl
          bg-white border border-gray-200 shadow-xl p-5
          dark:bg-[#0B1220] dark:border-white/10 dark:shadow-[0_20px_80px_rgba(0,0,0,0.7)]
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={loading ? undefined : onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              px-4 py-2 rounded-xl border border-gray-200 text-gray-700
              hover:bg-gray-50 transition disabled:opacity-60
              dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10
            "
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResponsableQuizDetailsPage() {
  const params = useParams();
  const jobOfferId = useMemo(() => String(params?.jobId || ""), [params]);

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);
  const [addingManual, setAddingManual] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [showGenerateMore, setShowGenerateMore] = useState(false);
  const [numMoreQuestions, setNumMoreQuestions] = useState(5);

  const [deletingOrder, setDeletingOrder] = useState(null);

  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQuizByJob(jobOfferId);
      setQuiz(res.data);
    } catch (err) {
      if (err?.response?.status === 404) setQuiz(null);
      else setError("Erreur lors du chargement du quiz");
    } finally {
      setLoading(false);
    }
  }, [jobOfferId]);

  useEffect(() => {
    if (!jobOfferId || jobOfferId === "undefined" || jobOfferId === "null") {
      setLoading(false);
      setError("jobId manquant dans l'URL");
      return;
    }
    load();
  }, [jobOfferId, load]);

  const questions = useMemo(() => {
    const qs = quiz?.questions;
    return Array.isArray(qs) ? qs : [];
  }, [quiz]);

  const handleGenerate = async (regen = false) => {
    setGenerating(true);
    setError(null);
    try {
      if (regen) await regenerateQuiz(jobOfferId);
      else await generateQuiz(jobOfferId);
      await load();
      setSuccessMsg(regen ? "Quiz regénéré avec succès" : "Quiz généré avec succès");
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!quiz?._id) return;
    setGeneratingMore(true);
    setError(null);
    try {
      await generateMoreQuestions(quiz._id, numMoreQuestions);
      await load();
      setShowGenerateMore(false);
      setSuccessMsg(`${numMoreQuestions} questions ajoutées au quiz`);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur génération");
    } finally {
      setGeneratingMore(false);
    }
  };

  const updateOption = (idx, text) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], text };
      return { ...prev, options: opts };
    });
  };

  const handleAddManual = async () => {
    if (!quiz?._id) return;

    if (!form.question.trim()) {
      setError("La question est requise");
      return;
    }
    const emptyOpts = form.options.filter((o) => !o.text.trim());
    if (emptyOpts.length > 0) {
      setError("Toutes les 4 options sont requises");
      return;
    }

    setAddingManual(true);
    setError(null);
    try {
      await addQuestion(quiz._id, {
        question: form.question.trim(),
        category: form.category,
        difficulty: form.difficulty,
        timeLimit: form.timeLimit ? Number(form.timeLimit) : undefined,
        options: form.options.map((o) => ({ key: o.key, text: o.text.trim() })),
        correctAnswer: form.correctAnswer,
        explanation: form.explanation.trim(),
      });

      await load();
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      setSuccessMsg("Question ajoutée avec succès");
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur ajout question");
    } finally {
      setAddingManual(false);
    }
  };

  const startEditing = (q, idx) => {
    const order = q.order || idx + 1;
    setEditingOrder(order);
    setEditForm({
      question: q.question || "",
      category: q.category || "skillsFit",
      difficulty: q.difficulty || "medium",
      timeLimit: String(getQuestionSeconds(q) || ""),
      options: (q.options || []).map((o) => ({ key: o.key, text: o.text })),
      correctAnswer: q.correctAnswer || "A",
      explanation: q.explanation || "",
    });

    setShowForm(false);
    setShowGenerateMore(false);
    setOpenDeleteModal(false);
    setQuestionToDelete(null);
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditForm(null);
  };

  const saveEditing = async () => {
    if (!quiz?._id || !editingOrder || !editForm) return;

    if (!editForm.question.trim()) {
      setError("La question est requise");
      return;
    }
    const emptyOpts = editForm.options.filter((o) => !safeStr(o.text));
    if (emptyOpts.length > 0) {
      setError("Toutes les 4 options sont requises");
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      await updateQuestion(quiz._id, editingOrder, {
        question: editForm.question.trim(),
        category: editForm.category,
        difficulty: editForm.difficulty,
        timeLimit: editForm.timeLimit ? Number(editForm.timeLimit) : undefined,
        options: editForm.options.map((o) => ({ key: o.key, text: safeStr(o.text) })),
        correctAnswer: editForm.correctAnswer,
        explanation: safeStr(editForm.explanation),
      });

      await load();
      setSuccessMsg("Question modifiée avec succès");
      cancelEditing();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur modification");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteQuestion = (order) => {
    if (!quiz?._id) return;
    cancelEditing();
    setQuestionToDelete(order);
    setOpenDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deletingOrder !== null) return;
    setOpenDeleteModal(false);
    setQuestionToDelete(null);
  };

  const handleDeleteQuestionConfirmed = async () => {
    if (!quiz?._id || questionToDelete === null) return;

    setDeletingOrder(questionToDelete);
    setError(null);
    try {
      await deleteQuestion(quiz._id, questionToDelete);
      await load();
      setSuccessMsg("Question supprimée");
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur suppression");
    } finally {
      setDeletingOrder(null);
      setQuestionToDelete(null);
      setOpenDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#6CB33F]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 dark:border-red-500/30 dark:bg-red-500/10">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 dark:text-red-300" />
          <div className="text-sm">
            <p className="font-semibold text-red-700 dark:text-red-200">Erreur</p>
            <p className="text-red-700/80 dark:text-red-200/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:bg-[#0B1220] dark:border-white/10">
          <p className="text-gray-800 dark:text-slate-200">Aucun quiz trouvé.</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleGenerate(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6CB33F] text-white font-semibold hover:bg-[#4E8F2F] transition"
            >
              <Zap className="w-4 h-4" />
              Générer le quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalMin = totalDurationMinutes(questions);

  return (
    <div
      className="
        min-h-screen
        bg-green-50
        dark:bg-gray-950
      "
    >
      {/* subtle glow background like recruiter */}
      <div className="pointer-events-none fixed inset-0 hidden dark:block">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Success toast */}
        {successMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 dark:text-emerald-300" />
            <div className="text-sm text-emerald-800 font-semibold dark:text-emerald-200">
              {successMsg}
            </div>
          </div>
        ) : null}

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quiz.jobTitle || "Quiz technique"}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-slate-300">
              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                {questions.length} question{questions.length > 1 ? "s" : ""}
              </span>
              <span className="dark:text-white/30">—</span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border dark:border-emerald-500/25">
                <CheckCircle2 className="w-3 h-3" />
                {quiz.status || quiz.jobStatus || "ACTIVE"}
              </span>

              <span className="dark:text-white/30">—</span>

              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Durée totale: {totalMin} min
              </span>
            </div>
          </div>

          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              border border-[#6CB33F] text-[#6CB33F]
              hover:bg-[#6CB33F]/5 disabled:opacity-60 transition-colors
              dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10
            "
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regénération…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Tout regénérer
              </>
            )}
          </button>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setShowGenerateMore(false);
              cancelEditing();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${
                showForm
                  ? "bg-[#6CB33F] text-white"
                  : "border border-[#6CB33F] text-[#6CB33F] hover:bg-[#6CB33F]/5 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              }`}
          >
            {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Ajouter manuellement
          </button>

          <button
            onClick={() => {
              setShowGenerateMore((v) => !v);
              setShowForm(false);
              cancelEditing();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${
                showGenerateMore
                  ? "bg-[#6CB33F] text-white"
                  : "border border-[#6CB33F] text-[#6CB33F] hover:bg-[#6CB33F]/5 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              }`}
          >
            <Sparkles className="w-4 h-4" />
            Générer plus de questions
          </button>
        </div>

        {/* Add manual form */}
        {showForm ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 dark:bg-[#0B1220] dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-gray-900 dark:text-white">Ajouter une question</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              >
                {Object.keys(CATEGORY_LABELS).map((k) => (
                  <option key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>

              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              >
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>

              <input
                value={form.timeLimit}
                onChange={(e) => setForm((p) => ({ ...p, timeLimit: e.target.value }))}
                placeholder="Timing (sec) ex: 40"
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              />
            </div>

            <textarea
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              placeholder="Question..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm min-h-[90px] dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {form.options.map((o, idx) => (
                <div key={o.key} className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm dark:bg-white/10 dark:text-slate-200">
                    {o.key}
                  </span>
                  <input
                    value={o.text}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${o.key}`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.correctAnswer}
                onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              >
                <option value="A">Réponse A</option>
                <option value="B">Réponse B</option>
                <option value="C">Réponse C</option>
                <option value="D">Réponse D</option>
              </select>

              <input
                value={form.explanation}
                onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
                placeholder="Explication (optionnel)"
                className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              />
            </div>

            <button
              onClick={handleAddManual}
              disabled={addingManual}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6CB33F] text-white font-semibold hover:bg-[#4E8F2F] transition disabled:opacity-60"
            >
              {addingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </button>
          </div>
        ) : null}

        {/* Generate more */}
        {showGenerateMore ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 dark:bg-[#0B1220] dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Générer plus de questions (IA)
              </h2>
              <button
                onClick={() => setShowGenerateMore(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-300" />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number"
                min={1}
                max={50}
                value={numMoreQuestions}
                onChange={(e) => setNumMoreQuestions(Number(e.target.value))}
                className="w-40 border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
              />
              <button
                onClick={handleGenerateMore}
                disabled={generatingMore}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#6CB33F] text-[#6CB33F] hover:bg-[#6CB33F]/5 transition disabled:opacity-60 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              >
                {generatingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Générer
              </button>
            </div>
          </div>
        ) : null}

        {/* Questions list */}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const order = q.order || idx + 1;
            const diff = safeStr(q.difficulty || "medium");
            const diffMeta = DIFFICULTY_LABELS[diff] || DIFFICULTY_LABELS.medium;
            const cat = safeStr(q.category || "skillsFit");
            const seconds = getQuestionSeconds(q);

            const isEditing = editingOrder === order;
            const isDeleting = deletingOrder === order;

            return (
              <div
                key={q._id || order}
                className="
                  rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden
                  dark:bg-[#0B1220] dark:border-white/10 dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)]
                "
              >
                {/* top row */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#6CB33F] text-white font-extrabold flex items-center justify-center shrink-0">
                      {order}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200 dark:border dark:border-blue-500/25">
                          {CATEGORY_LABELS[cat] || cat || "Compétences"}
                        </span>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${diffMeta.color}`}>
                          {diffMeta.label}
                        </span>

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 inline-flex items-center gap-1.5 dark:bg-white/10 dark:text-slate-200 dark:border dark:border-white/10">
                          <Clock className="w-3.5 h-3.5" />
                          {seconds}s
                        </span>
                      </div>

                      {!isEditing ? (
                        <p className="mt-3 font-semibold text-gray-900 dark:text-white">
                          {q.question}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          <textarea
                            value={editForm?.question || ""}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, question: e.target.value }))
                            }
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm min-h-[90px] dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                              value={editForm?.category || "skillsFit"}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, category: e.target.value }))
                              }
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                            >
                              {Object.keys(CATEGORY_LABELS).map((k) => (
                                <option key={k} value={k}>
                                  {CATEGORY_LABELS[k]}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editForm?.difficulty || "medium"}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, difficulty: e.target.value }))
                              }
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                            >
                              <option value="easy">Facile</option>
                              <option value="medium">Moyen</option>
                              <option value="hard">Difficile</option>
                            </select>

                            <input
                              value={editForm?.timeLimit || ""}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, timeLimit: e.target.value }))
                              }
                              placeholder="Timing (sec) ex: 40"
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(editForm?.options || []).map((o, oi) => (
                              <div key={o.key} className="flex items-center gap-2">
                                <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm dark:bg-white/10 dark:text-slate-200">
                                  {o.key}
                                </span>
                                <input
                                  value={o.text}
                                  onChange={(e) =>
                                    setEditForm((p) => {
                                      const arr = [...p.options];
                                      arr[oi] = { ...arr[oi], text: e.target.value };
                                      return { ...p, options: arr };
                                    })
                                  }
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <select
                              value={editForm?.correctAnswer || "A"}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, correctAnswer: e.target.value }))
                              }
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                            >
                              <option value="A">Réponse A</option>
                              <option value="B">Réponse B</option>
                              <option value="C">Réponse C</option>
                              <option value="D">Réponse D</option>
                            </select>

                            <input
                              value={editForm?.explanation || ""}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, explanation: e.target.value }))
                              }
                              placeholder="Explication (optionnel)"
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm dark:bg-[#0A1020] dark:border-white/10 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditing ? (
                      <button
                        onClick={() => startEditing(q, idx)}
                        className="p-2 rounded-full hover:bg-gray-100 transition dark:hover:bg-white/10"
                        title="Modifier"
                      >
                        <Pencil className="w-5 h-5 text-gray-500 dark:text-slate-300" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveEditing}
                          disabled={savingEdit}
                          className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-60 dark:hover:bg-white/10"
                          title="Enregistrer"
                        >
                          {savingEdit ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-slate-300" />
                          ) : (
                            <Save className="w-5 h-5 text-gray-500 dark:text-slate-300" />
                          )}
                        </button>

                        <button
                          onClick={cancelEditing}
                          disabled={savingEdit}
                          className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-60 dark:hover:bg-white/10"
                          title="Annuler"
                        >
                          <X className="w-5 h-5 text-gray-500 dark:text-slate-300" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => confirmDeleteQuestion(order)}
                      disabled={isDeleting}
                      className="p-2 rounded-full hover:bg-red-50 transition disabled:opacity-60 dark:hover:bg-red-500/10"
                      title="Supprimer"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* options + explanation */}
                {!isEditing ? (
                  <div className="px-5 pb-5 space-y-3">
                    {(q.options || []).map((o, oi) => {
                      const isCorrect =
                        safeStr(q.correctAnswer).toUpperCase() ===
                        safeStr(o.key).toUpperCase();

                      return (
                        <div
                          key={`${order}-${oi}-${o.key}`}
                          className={`
                            flex items-center justify-between gap-3 rounded-2xl border px-4 py-3
                            ${
                              isCorrect
                                ? "border-green-300 bg-green-50 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                                : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`
                                w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0
                                ${
                                  isCorrect
                                    ? "bg-green-600 text-white dark:bg-emerald-500"
                                    : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-slate-200"
                                }
                              `}
                            >
                              {o.key}
                            </div>

                            <p className="text-sm font-medium break-words text-gray-800 dark:text-slate-200">
                              {o.text}
                            </p>
                          </div>

                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 dark:text-emerald-300" />
                          ) : null}
                        </div>
                      );
                    })}

                    {q.explanation ? (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/25 dark:bg-blue-500/10">
                        <p className="text-sm font-extrabold text-blue-800 dark:text-blue-200">
                          Explication
                        </p>
                        <p className="mt-1 text-sm text-blue-900/80 dark:text-blue-200/80">
                          {q.explanation}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Modal delete */}
        <ConfirmModal
          open={openDeleteModal}
          title="Supprimer la question ?"
          subtitle="Cette action est irréversible."
          loading={deletingOrder !== null}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteQuestionConfirmed}
        />
      </div>
    </div>
  );
}