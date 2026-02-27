// quiz.api.js — ajouter ces 2 fonctions au fichier existant
import api from "./api";

/** ✅ Récupérer tous les quiz */
export const getAllQuizzes = () => api.get("/quizzes");

/** Récupérer le quiz d'une offre */
export const getQuizByJob = (jobId) => api.get(`/quizzes/job/${jobId}`);

/** Récupérer un quiz par ID */
export const getQuizById = (id) => api.get(`/quizzes/${id}`);

/** Générer un quiz pour une offre */
export const generateQuiz = (jobId) => api.post(`/quizzes/generate/${jobId}`);

/** Regénérer le quiz d'une offre */
export const regenerateQuiz = (jobId) => api.post(`/quizzes/regenerate/${jobId}`);

/** ✅ Générer des questions supplémentaires */
export const generateMoreQuestions = (quizId, numQuestions) =>
  api.post(`/quizzes/${quizId}/generate-more`, { numQuestions });

/** Modifier tout le quiz */
export const updateQuiz = (id, questions) => api.put(`/quizzes/${id}`, { questions });

/** Modifier une question */
export const updateQuestion = (quizId, order, data) =>
  api.put(`/quizzes/${quizId}/questions/${order}`, data);

/** Supprimer une question */
export const deleteQuestion = (quizId, order) =>
  api.delete(`/quizzes/${quizId}/questions/${order}`);

/** Ajouter une question */
export const addQuestion = (quizId, data) =>
  api.post(`/quizzes/${quizId}/questions`, data);

/** Supprimer un quiz complet */
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
export function checkQuizAlreadySubmitted(quizId, candidatureId) {
  return api.get(
    `/quiz-submissions/check?quizId=${quizId}&candidatureId=${candidatureId}`
  );
}

export const getMyQuizzes = () => api.get("/quizzes/mine");

// ── 🆕 QUIZ SUBMISSIONS (candidat) ────────────────────────────

/**
 * Soumettre les réponses d'un quiz
 * POST /quiz-submissions
 * @param {{ quizId: string, candidatureId?: string, answers: Array<{order: number, selectedAnswer: string}> }} payload
 */
export const submitQuiz = (payload) => api.post("/quiz-submissions", payload);

/**
 * Récupérer le résultat d'une soumission
 * GET /quiz-submissions/:id
 */
export const getQuizSubmission = (id) => api.get(`/quiz-submissions/${id}`);
export function generateQuizForJob(jobId) {
  return axios.post(`${API_URL}/quizzes/generate/${jobId}`, null, {
    headers: authHeaders(),
  });
}
