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
  easy: { label: "Facile", color: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  medium: { label: "Moyen", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  hard: { label: "Difficile", color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
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
  options: [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ],
  correctAnswer: "A",
  explanation: "",
};

export default function QuizTechniqueDetailsPage() {
  const params = useParams();
  const jobOfferId = useMemo(() => String(params?.jobOfferId || ""), [params]);

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

  // ✅ Modal suppression (au lieu de confirm)
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
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
      setError("jobOfferId manquant dans l'URL");
      return;
    }
    load();
  }, [jobOfferId, load]);

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

  // ✅ Open modal suppression
  const confirmDeleteQuestion = (order) => {
    if (!quiz?._id) return;
    // si tu es en édition, on ferme l'édition pour éviter conflit UX
    setEditingOrder(null);
    setEditForm(null);

    setQuestionToDelete(order);
    setOpenDeleteModal(true);
  };

  // ✅ Confirm modal suppression
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

  const closeDeleteModal = () => {
    if (deletingOrder !== null) return; // pendant suppression: on bloque fermeture
    setOpenDeleteModal(false);
    setQuestionToDelete(null);
  };

  const updateOption = (idx, text) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], text };
      return { ...prev, options: opts };
    });
  };

  const startEditing = (q, idx) => {
    const order = q.order || idx + 1;
    setEditingOrder(order);
    setEditForm({
      question: q.question || "",
      category: q.category || "skillsFit",
      difficulty: q.difficulty || "medium",
      options: (q.options || []).map((o) => ({ key: o.key, text: o.text })),
      correctAnswer: q.correctAnswer || "A",
      explanation: q.explanation || "",
    });

    // fermer les autres panneaux
    setShowForm(false);
    setShowGenerateMore(false);

    // si modal delete ouvert, on le ferme
    setOpenDeleteModal(false);
    setQuestionToDelete(null);
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!quiz?._id || !editForm || editingOrder === null) return;

    if (!editForm.question.trim()) {
      setError("La question est requise");
      return;
    }
    const emptyOpts = editForm.options.filter((o) => !o.text.trim());
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
        options: editForm.options.map((o) => ({ key: o.key, text: o.text.trim() })),
        correctAnswer: editForm.correctAnswer,
        explanation: editForm.explanation.trim(),
      });

      await load();
      cancelEditing();
      setSuccessMsg("Question modifiée avec succès");
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur modification");
    } finally {
      setSavingEdit(false);
    }
  };

  const updateEditOption = (idx, text) => {
    setEditForm((prev) => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], text };
      return { ...prev, options: opts };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6CB33F]" />
        <span className="text-sm text-gray-400 font-medium">Chargement du quiz…</span>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 rounded-2xl bg-[#6CB33F]/10 flex items-center justify-center">
            <Zap className="w-8 h-8 text-[#6CB33F]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aucun quiz pour cette offre</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Générez automatiquement un quiz technique basé sur l'offre d'emploi
            </p>
          </div>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6CB33F] text-white font-medium
                       hover:bg-[#5fa035] disabled:opacity-60 transition-colors shadow-lg shadow-[#6CB33F]/20"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Générer le quiz
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Banners */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300 flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quiz.jobTitle || "Quiz technique"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                {questions.length} question{questions.length > 1 ? "s" : ""}
              </span>
              <span>—</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {quiz.status || "ACTIVE"}
              </span>
              <span>—</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Durée totale: {_totalDuration(questions)} min
              </span>
            </div>
          </div>

          <button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                       border border-[#6CB33F] text-[#6CB33F]
                       hover:bg-[#6CB33F]/5 dark:hover:bg-[#6CB33F]/10
                       disabled:opacity-60 transition-colors"
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
                  : "border border-[#6CB33F] text-[#6CB33F] hover:bg-[#6CB33F]/5 dark:hover:bg-[#6CB33F]/10"
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
                  : "border border-[#6CB33F] text-[#6CB33F] hover:bg-[#6CB33F]/5 dark:hover:bg-[#6CB33F]/10"
              }`}
          >
            {showGenerateMore ? <ChevronUp className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            Générer plus de questions
          </button>
        </div>
      </div>

      {/* Panel : Générer plus */}
      {showGenerateMore && (
        <div className="p-6 rounded-2xl border border-[#6CB33F]/30 bg-[#6CB33F]/5 dark:bg-[#6CB33F]/10 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            Générer des questions supplémentaires via IA
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Les nouvelles questions seront ajoutées à la suite du quiz existant.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nombre de questions</label>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 15].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumMoreQuestions(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${
                        numMoreQuestions === n
                          ? "bg-[#6CB33F] text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    {n}
                  </button>
                ))}

                <span className="text-xs text-gray-400 ml-1">ou</span>

                <input
                  type="number"
                  min={1}
                  max={30}
                  value={numMoreQuestions}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= 30) setNumMoreQuestions(v);
                  }}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                             text-sm text-center font-medium text-gray-700 dark:text-gray-300
                             focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F]"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateMore}
              disabled={generatingMore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6CB33F] text-white font-medium
                         hover:bg-[#5fa035] disabled:opacity-60 transition-colors"
            >
              {generatingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Générer {numMoreQuestions} questions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Panel : Ajout manuel */}
      {showForm && (
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Nouvelle question manuelle</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Question *</label>
            <textarea
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              placeholder="Quelle est la commande pour…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                         text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                           text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F]"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Difficulté{" "}
                <span className="ml-2 text-gray-400">(Timer: {TIMER_BY_DIFFICULTY[form.difficulty]}s)</span>
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                           text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F]"
              >
                <option value="easy">Facile (20s)</option>
                <option value="medium">Moyen (40s)</option>
                <option value="hard">Difficile (60s)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Options * (cliquez sur le cercle pour la bonne réponse)
            </label>
            {form.options.map((opt, i) => (
              <div key={opt.key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, correctAnswer: opt.key }))}
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${
                      form.correctAnswer === opt.key
                        ? "bg-[#6CB33F] text-white ring-2 ring-[#6CB33F]/30"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                >
                  {opt.key}
                </button>

                <input
                  value={opt.text}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${opt.key}`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                             text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow placeholder:text-gray-400"
                />

                {form.correctAnswer === opt.key && <CheckCircle2 className="w-5 h-5 text-[#6CB33F] shrink-0" />}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Explication (optionnel)</label>
            <input
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              placeholder="Pourquoi cette réponse est correcte…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800
                         text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow placeholder:text-gray-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ ...EMPTY_FORM });
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>

            <button
              onClick={handleAddManual}
              disabled={addingManual}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6CB33F] text-white text-sm font-medium
                         hover:bg-[#5fa035] disabled:opacity-60 transition-colors"
            >
              {addingManual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ajout…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Ajouter la question
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
          <AlertCircle className="w-10 h-10 stroke-[1.5]" />
          <p className="text-sm font-medium">Aucune question disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const order = q.order || idx + 1;
            const isEditing = editingOrder === order;

            if (isEditing && editForm) {
              return (
                <div
                  key={q._id || idx}
                  className="rounded-2xl border-2 border-[#6CB33F]/50 bg-white dark:bg-gray-900 shadow-lg shadow-[#6CB33F]/5"
                >
                  <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-full bg-[#6CB33F] text-white flex items-center justify-center font-bold text-sm">
                        {order}
                      </div>
                      <h3 className="text-sm font-semibold text-[#6CB33F]">Modification de la question</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Question *</label>
                      <textarea
                        value={editForm.question}
                        onChange={(e) => setEditForm((p) => ({ ...p, question: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Catégorie</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F]"
                        >
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Difficulté{" "}
                          <span className="ml-2 text-gray-400">
                            (Timer: {TIMER_BY_DIFFICULTY[editForm.difficulty]}s)
                          </span>
                        </label>
                        <select
                          value={editForm.difficulty}
                          onChange={(e) => setEditForm((p) => ({ ...p, difficulty: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F]"
                        >
                          <option value="easy">Facile ({TIMER_BY_DIFFICULTY.easy}s)</option>
                          <option value="medium">Moyen ({TIMER_BY_DIFFICULTY.medium}s)</option>
                          <option value="hard">Difficile ({TIMER_BY_DIFFICULTY.hard}s)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Options * (cliquez sur le cercle pour la bonne réponse)
                      </label>
                      {editForm.options.map((opt, i) => (
                        <div key={opt.key} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditForm((p) => ({ ...p, correctAnswer: opt.key }))}
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                              ${
                                editForm.correctAnswer === opt.key
                                  ? "bg-[#6CB33F] text-white ring-2 ring-[#6CB33F]/30"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                              }`}
                          >
                            {opt.key}
                          </button>

                          <input
                            value={opt.text}
                            onChange={(e) => updateEditOption(i, e.target.value)}
                            placeholder={`Option ${opt.key}`}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow placeholder:text-gray-400"
                          />

                          {editForm.correctAnswer === opt.key && (
                            <CheckCircle2 className="w-5 h-5 text-[#6CB33F] shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Explication (optionnel)</label>
                      <input
                        value={editForm.explanation}
                        onChange={(e) => setEditForm((p) => ({ ...p, explanation: e.target.value }))}
                        placeholder="Pourquoi cette réponse est correcte…"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB33F]/30 focus:border-[#6CB33F] transition-shadow placeholder:text-gray-400"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        Annuler
                      </button>

                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6CB33F] text-white text-sm font-medium hover:bg-[#5fa035] disabled:opacity-60 transition-colors"
                      >
                        {savingEdit ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sauvegarde…
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            const diff = DIFFICULTY_LABELS[q.difficulty] || DIFFICULTY_LABELS.medium;
            const timer = TIMER_BY_DIFFICULTY[q.difficulty] || 60;
            const catLabel = CATEGORY_LABELS[q.category] || q.category || "Général";

            return (
              <div
                key={q._id || idx}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-[#6CB33F] text-white flex items-center justify-center font-bold text-sm">
                      {order}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {catLabel}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${diff.color}`}>
                          {diff.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {timer}s
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                        {q.question}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditing(q, idx)}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#6CB33F] hover:bg-[#6CB33F]/10 transition-colors"
                        title="Modifier cette question"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => confirmDeleteQuestion(order)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Supprimer cette question"
                        disabled={deletingOrder !== null}
                      >
                        {deletingOrder === order ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 ml-12">
                    {(q.options || []).map((option, optIdx) => {
                      const isCorrect = option.key === q.correctAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border transition-colors
                            ${
                              isCorrect
                                ? "border-[#6CB33F]/40 bg-[#6CB33F]/5 dark:bg-[#6CB33F]/10"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                              ${
                                isCorrect
                                  ? "bg-[#6CB33F] text-white"
                                  : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {option.key}
                            </div>
                            <p
                              className={`flex-1 text-sm ${
                                isCorrect ? "font-medium text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {option.text}
                            </p>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-[#6CB33F] shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-4 ml-12 p-4 rounded-xl bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-blue-800 dark:text-gray-400 mb-1">Explication</p>
                      <p className="text-sm text-blue-700 dark:text-gray-200 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Modal suppression */}
      {openDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={closeDeleteModal}
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Supprimer la question
              </h2>
              <button onClick={closeDeleteModal} disabled={deletingOrder !== null}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="mt-2 text-sm text-red-500 font-semibold">
              Cette action est irréversible
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer cette question du quiz ?
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={closeDeleteModal}
                disabled={deletingOrder !== null}
                className="px-5 py-2 rounded-xl text-sm font-medium
                           text-gray-600 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60 transition"
              >
                Annuler
              </button>

              <button
                onClick={handleDeleteQuestionConfirmed}
                disabled={deletingOrder !== null || questionToDelete === null}
                className="px-5 py-2 rounded-xl text-sm font-medium
                           bg-red-500 text-white hover:bg-red-600
                           disabled:opacity-60 transition"
              >
                {deletingOrder !== null ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function _totalDuration(questions) {
  const totalSec = questions.reduce((acc, q) => acc + (TIMER_BY_DIFFICULTY[q.difficulty] || 60), 0);
  return Math.ceil(totalSec / 60);
}