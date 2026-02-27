// app/recruiter/PreInterviewList/[candidatureId]/results/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../services/api";
import Link from "next/link";
import {
  Brain,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  Briefcase,
  Mail,
  Download,
} from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeStr(v) {
  return v ? String(v).trim() : "";
}

// ── Cercle de score ──────────────────────────────────────────────────────────────
function ScoreCircle({ percentage }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 80 ? "#16A34A" : percentage >= 65 ? "#22C55E" : percentage >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb dark:stroke-slate-700" strokeWidth="12" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-xs font-medium mt-1" style={{ color }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

// ── Bouton PDF ───────────────────────────────────────────────────────────────────
function PdfDownloadButton({ submissionId }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fiche-submissions/${submissionId}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiche_candidature.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement du PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="
        inline-flex items-center gap-2 px-6 py-3 
        bg-green-600 hover:bg-green-600
        text-white rounded-lg font-medium shadow-md 
        disabled:opacity-60 transition-all transform hover:scale-105
        dark:bg-green-700 dark:hover:bg-green-600
      "
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        Télécharger le PDF
      </button>
    </div>
  );
}

// ── Section Quiz avec affichage complet des réponses ─────────────────────────────
function QuizSection({ quiz, questions = [] }) {
  const [expanded, setExpanded] = useState(true);

  const resolveAnswer = (val, order) => {
    if (val === null || val === undefined) return "—";

    const str = String(val).trim().toUpperCase();

    // Si c'est une lettre (A, B, C, ...)
    if (/^[A-E]$/.test(str)) {
      const idx = str.charCodeAt(0) - 65;

      const question = questions.find(q => q.order === order);
      if (!question?.options) return str;

      const opt = question.options[idx];
      if (!opt) return str;

      // Cas les plus courants
      if (typeof opt === "string") return opt.trim();

      if (typeof opt === "object" && opt !== null) {
        return (
          opt.text ||
            opt.label ||
            opt.value ||
            opt.content ||
            opt.option ||
            opt[str] ||
            opt[str.toLowerCase()] ||
            opt.key === str ? opt.text || opt.label || str : str
        );
      }

      return str;
    }

    // Sinon on retourne directement la valeur (déjà texte)
    return String(val).trim();
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2.5 text-gray-900 dark:text-white">
            <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Résultats du Quiz Technique
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Terminé le {formatDate(quiz.submittedAt)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8">
          <div className="shrink-0">
            <ScoreCircle percentage={quiz.percentage} />
          </div>

          <div className="flex-1 grid grid-cols-3 gap-5">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800/40">
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{quiz.score}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">CORRECTES</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-100 dark:border-red-800/40">
              <p className="text-3xl font-bold text-red-700 dark:text-red-300">{quiz.totalQuestions - quiz.score}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">INCORRECTES</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{quiz.totalQuestions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">TOTAL</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {quiz.answers?.map((a, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border ${a.isCorrect
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/40"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/40"
                }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0 ${a.isCorrect ? "bg-green-600" : "bg-red-600"
                    }`}
                >
                  {a.order || i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                    {a.question}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-2">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${a.isCorrect
                        ? "bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200"
                        : "bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200"
                        }`}
                    >
                      {a.isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {resolveAnswer(a.selectedAnswer, a.order)}
                    </div>

                    {!a.isCorrect && a.correctAnswer && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-4 h-4" />
                        {resolveAnswer(a.correctAnswer, a.order)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Fiche (simplifiée comme demandé) ─────────────────────────────────────────────
function FicheSection({ fiche }) {
  if (!fiche) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2.5 text-gray-900 dark:text-white">
            <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400" />
            Fiche de Renseignements
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Complétée
          </span>
        </div>
      </div>
      <div className="px-6 py-5 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-right">
        <PdfDownloadButton submissionId={fiche._id} />
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────────
export default function CandidateResultsPage() {
  const params = useParams();
  const candidatureId = params?.candidatureId;

  const [quiz, setQuiz] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [candidature, setCandidature] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidatureId) return;

    async function fetchAll() {
      setLoading(true);
      try {
        const [cRes, qRes, fRes] = await Promise.all([
          api.get(`/candidatures/${candidatureId}`),
          api.get(`/quiz-submissions/candidature/${candidatureId}`),
          api.get(`/fiche-submissions/candidature/${candidatureId}`),
        ]);

        setCandidature(cRes.data);

        const quizzes = Array.isArray(qRes.data) ? qRes.data : [];
        const latestQuiz = quizzes[0] || null;
        setQuiz(latestQuiz);

        if (latestQuiz?.quizId) {
          const qqRes = await api.get(`/quizzes/${latestQuiz.quizId}`);
          setQuizQuestions(qqRes.data?.questions || []);
        }

        const fiches = Array.isArray(fRes.data) ? fRes.data : [];
        setFiche(fiches[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [candidatureId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const name =
    safeStr(candidature?.fullName) ||
    `${safeStr(candidature?.prenom)} ${safeStr(candidature?.nom)}`.trim() ||
    safeStr(candidature?.email) ||
    "Candidat";

  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* En-tête profil */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-green-600 dark:green-600 dark:to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {initials}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Quiz – 2/3 largeur */}
          <div className="lg:col-span-2">
            {quiz ? (
              <QuizSection quiz={quiz} questions={quizQuestions} />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-500 dark:text-gray-400">
                Aucun quiz soumis
              </div>
            )}
          </div>

          {/* Fiche */}
          <div>
            {fiche ? (
              <FicheSection fiche={fiche} />
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-500 dark:text-gray-400">
                Fiche non complétée
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}