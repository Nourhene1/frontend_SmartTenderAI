"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllQuizzes, deleteQuiz } from "../../services/quiz.api";
import {
  Loader2,
  Search,
  Trash2,
  ExternalLink,
  AlertCircle,
  ClipboardList,
  HelpCircle,
} from "lucide-react";

/* ─── Modal de confirmation de suppression (design comme Gestion Roles) ─── */
function DeleteModal({ quiz, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800 p-6 sm:p-8 shadow-2xl transition-colors duration-300">
        <h2 className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400">
          Supprimer ce quiz
        </h2>

        <p className="mt-4 text-sm sm:text-base text-gray-700 dark:text-gray-300">
          Voulez-vous vraiment supprimer le quiz{" "}
          <span className="font-bold text-gray-900 dark:text-white">
            {quiz?.jobTitle || quiz?.titre || "Sans titre"}
          </span>{" "}
          ?
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full
                       border border-slate-300 dark:border-gray-600
                       text-slate-700 dark:text-gray-200
                       font-semibold
                       hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-500 dark:bg-red-600
                       hover:bg-red-600 dark:hover:bg-red-500
                       text-white px-6 py-2.5 rounded-full
                       font-semibold transition-colors
                       disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ─── */
export default function QuizTechniqueListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [quizToDelete, setQuizToDelete] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllQuizzes();
      setItems(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = (x.jobTitle || x.titre || "").toLowerCase();
      const jobId = (x.jobOfferId || "").toLowerCase();
      return title.includes(s) || jobId.includes(s);
    });
  }, [items, q]);

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    setDeletingId(quizToDelete._id);
    try {
      await deleteQuiz(quizToDelete._id);
      setItems((prev) => prev.filter((x) => x._id !== quizToDelete._id));
      setQuizToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur suppression");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <>
      {/* Modal de suppression */}
      {quizToDelete && (
        <DeleteModal
          quiz={quizToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setQuizToDelete(null)}
          isDeleting={!!deletingId}
        />
      )}

      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Quiz techniques
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {items.length} quiz disponibles
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 dark:text-emerald-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par titre ou jobId..."
              className="w-full rounded-full
                         bg-white dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         pl-12 pr-5 py-3 text-sm
                         text-gray-800 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         shadow-sm outline-none
                         focus:ring-2 focus:ring-green-300 dark:focus:ring-emerald-500/40
                         transition-colors"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl
                            bg-red-50 dark:bg-red-900/30
                            border border-red-200 dark:border-red-800 transition-colors">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* LIST */}
          <div className="space-y-4">
            {filtered.map((x) => {
              const isActive = x.status === "ACTIVE";
              const questionsCount =
                x.totalQuestions ?? x.questionsCount ?? x.questions?.length ?? 0;

              return (
                <div
                  key={x._id}
                  className="bg-white dark:bg-gray-800 rounded-full
                             px-6 py-4
                             flex items-center justify-between
                             shadow-sm hover:shadow-md
                             dark:shadow-none
                             dark:hover:bg-gray-800/80
                             transition-colors"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* ICÔNE quiz */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                        ${
                          isActive
                            ? "bg-green-100 text-green-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                    >
                      <ClipboardList className="w-5 h-5" />
                    </div>

                    {/* TEXT */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {x.jobTitle || x.titre || "Sans titre"}
                        </h3>

                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-semibold
                            ${
                              isActive
                                ? "bg-green-100 text-green-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {x.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-green-500 dark:text-emerald-400" />
                          {questionsCount} questions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/recruiter/QuizTechnique/${x.jobOfferId}`}
                      className="inline-flex items-center gap-2
                                 px-4 py-2 rounded-full
                                 bg-gray-100 dark:bg-gray-700
                                 text-gray-800 dark:text-gray-100
                                 text-sm font-medium
                                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Voir
                    </Link>

                    <button
                      onClick={() => setQuizToDelete(x)}
                      disabled={deletingId === x._id}
                      className="w-10 h-10 rounded-full
                                 flex items-center justify-center
                                 text-red-500 dark:text-red-400
                                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                                 disabled:opacity-60"
                    >
                      {deletingId === x._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
