import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getJobs() { return axios.get(`${API_URL}/jobs`); }
export function getActiveJobs() { return axios.get(`${API_URL}/jobs/active`); }
export function getJobById(id) { return axios.get(`${API_URL}/jobs/${id}`); }
export function createJob(data) { return axios.post(`${API_URL}/jobs`, data, { headers: authHeaders() }); }
export function getMyOffers() { return axios.get(`${API_URL}/jobs/my-offers`, { headers: authHeaders() }); }
export function updateMyJob(id, data) { return axios.put(`${API_URL}/jobs/my-offers/${id}`, data, { headers: authHeaders() }); }
export function getAllJobs() { return axios.get(`${API_URL}/jobs/all`, { headers: authHeaders() }); }
export function getPendingJobs() { return axios.get(`${API_URL}/jobs/pending`, { headers: authHeaders() }); }
export function getJobCount() { return axios.get(`${API_URL}/jobs/count`, { headers: authHeaders() }); }
export function getJobsWithCandidatureCount() { return axios.get(`${API_URL}/jobs/with-candidatures-count`, { headers: authHeaders() }); }
export function updateJob(id, data) { return axios.put(`${API_URL}/jobs/${id}`, data, { headers: authHeaders() }); }
export function deleteJob(id) { return axios.delete(`${API_URL}/jobs/${id}`, { headers: authHeaders() }); }
export function confirmJob(id) { return axios.put(`${API_URL}/jobs/${id}/confirm`, {}, { headers: authHeaders() }); }
export function rejectJob(id, reason) { return axios.put(`${API_URL}/jobs/${id}/reject`, reason ? { reason } : {}, { headers: authHeaders() }); }
export function checkJobClosed(id) { return axios.get(`${API_URL}/jobs/${id}/is-closed`); }
export function getJobsByUser(userId) { return axios.get(`${API_URL}/jobs/user/${userId}`, { headers: authHeaders() }); }
export function reactivateJob(id, newDateCloture) { return axios.put(`${API_URL}/jobs/${id}/reactivate`, { newDateCloture }, { headers: authHeaders() }); }

// LINKEDIN
export function publishJobOnLinkedIn(jobId, formData) {
  return axios.post(
    `${API_URL}/jobs/${jobId}/publish-linkedin`,
    formData,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

export function checkLinkedInStatus() {
  return axios.get(`${API_URL}/linkedin/status`, { headers: authHeaders() });
}
// ✅ FIX: passer returnJobId pour que le callback redirige vers la bonne page
export function getLinkedInAuthUrl(returnJobId = null) {
  const params = returnJobId ? `?returnJobId=${returnJobId}` : "";
  return axios.get(`${API_URL}/linkedin/auth-url${params}`, { headers: authHeaders() });
}
// ✅ CRUCIAL: Lier le token LinkedIn au user connecté après OAuth callback
export function confirmLinkedInToken(memberId) {
  return axios.post(`${API_URL}/linkedin/confirm-token`, { memberId }, { headers: authHeaders() });
}

/**
 * ✅ NOUVEAU: Envoyer le code OAuth reçu de LinkedIn au backend pour échange
 * POST /linkedin/exchange-code
 * Body: { code, state }
 * Retourne: { connected: true, memberId, returnJobId }
 */
export function exchangeLinkedInCode(code, state) {
  return axios.post(
    `${API_URL}/linkedin/exchange-code`,
    { code, state },
    { headers: authHeaders() }
  );
}

export function getMyAssignedJobs() {
  return axios.get(`${API_URL}/jobs/my-assigned`, { headers: authHeaders() });
}


export function validateJob(id) {
  // step 1: EN_ATTENTE -> VALIDEE
  return axios.put(`${API_URL}/jobs/${id}/validate`, {}, { headers: authHeaders() });
}

