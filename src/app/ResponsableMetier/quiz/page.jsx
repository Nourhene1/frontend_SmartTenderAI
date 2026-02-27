"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMyQuizzes, deleteQuiz } from "../../services/quiz.api";
import {
  Loader2,
  Search,
  FileText,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";

/** Helpers */
function safeStr(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function getStatusLabel(raw) {
  const s = safeStr(raw).toUpperCase();
  if (["ACTIVE", "CONFIRMEE", "CONFIRMÉE", "CONFIRMEE"].includes(s)) return "ACTIVE";
  return s || "ACTIVE";
}

/** Modal */
function ConfirmDeleteModal({
  open,
  title,
  subtitle,
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onClose}
      />

      {/* dialog */}
      <div className="relative w-[92%] max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={loading ? undefined : onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-60"
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

export default function ResponsableQuizListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // delete modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // { quizId, title }
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getMyQuizzes();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = safeStr(q).toLowerCase();
    if (!query) return items;

    return items.filter((it) => {
      const title = safeStr(it?.jobTitle || it?.titre || it?.title).toLowerCase();
      const jobId = safeStr(it?.jobOfferId || it?.jobId || it?._id).toLowerCase();
      return title.includes(query) || jobId.includes(query);
    });
  }, [items, q]);

  const total = filtered.length;

  function openDeleteModal(quizId, title) {
    setSelectedQuiz({ quizId, title: title || "ce quiz" });
    setModalOpen(true);
  }

  function closeDeleteModal() {
    if (deletingId) return; // ما نغلقش وقت deleting
    setModalOpen(false);
    setSelectedQuiz(null);
  }

  async function confirmDelete() {
    const quizId = selectedQuiz?.quizId;
    if (!quizId) return;

    try {
      setDeletingId(quizId);
      await deleteQuiz(quizId);

      // update UI
      setItems((prev) => prev.filter((x) => (x?._id || x?.id) !== quizId));

      // close modal
      setModalOpen(false);
      setSelectedQuiz(null);
    } catch (e) {
      console.error(e);
      // خليه toast/inline إذا تحب، توّا نستعمل alert بسيط فقط للأخطاء
      alert(e?.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#2FAE5A]" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Quiz techniques
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {total} quiz {total > 1 ? "disponibles" : "disponible"}
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-3xl">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 px-5 py-3 shadow-sm">
                <Search className="w-5 h-5 text-green-600" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher par titre ou jobId..."
                  className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="mt-8 space-y-5">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-14">
                Aucun quiz disponible.
              </div>
            ) : (
              filtered.map((it) => {
                const quizId = it?._id || it?.id; // delete uses quiz id
                const openId = it?.jobOfferId || it?.jobId || it?._id; // open uses job id (حسب عندك)
                const title = it?.jobTitle || it?.titre || "Offre";
                const status = getStatusLabel(it?.jobStatus || it?.status);

                const questionsCount = Array.isArray(it?.questions)
                  ? it.questions.length
                  : (typeof it?.numQuestions === "number" ? it.numQuestions : null);

                const isDeleting = deletingId === quizId;

                return (
                  <div
                    key={quizId || openId}
                    className="bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm px-5 py-4 flex items-center justify-between gap-4"
                  >
                    {/* Left: icon */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-full bg-[#DDF4E2] flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-green-700" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-extrabold text-gray-900 dark:text-white truncate">
                            {title}
                          </p>

                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#DDF4E2] text-green-800">
                            {status}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-green-500 text-green-600 text-[10px]">
                            ?
                          </span>
                          <span>
                            {questionsCount !== null
                              ? `${questionsCount} questions`
                              : "Questions disponibles"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        href={`/ResponsableMetier/quiz/${openId}`}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir
                      </Link>

                      <button
                        type="button"
                        disabled={isDeleting || !quizId}
                        onClick={() => openDeleteModal(quizId, title)}
                        className={[
                          "w-11 h-11 rounded-full flex items-center justify-center transition",
                          isDeleting
                            ? "bg-red-50 opacity-60 cursor-not-allowed"
                            : "hover:bg-red-50",
                        ].join(" ")}
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
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <ConfirmDeleteModal
        open={modalOpen}
        title="Supprimer le quiz ?"
        subtitle={
          selectedQuiz?.title
            ? `Vous êtes sur le point de supprimer le quiz lié à : "${selectedQuiz.title}".`
            : "Cette action est irréversible."
        }
        loading={Boolean(deletingId)}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}