import axios from "axios";

const API_BASE = "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startSubmission({ ficheId, candidatureId }) {
  return axios.post(
    `${API_BASE}/fiche-submissions/start`,
    { ficheId, candidatureId },
    { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }
  );
}

export async function addAnswer(submissionId, payload) {
  return axios.post(
    `${API_BASE}/fiche-submissions/${submissionId}/answer`,
    payload,
    { headers: { "Content-Type": "application/json", ...getAuthHeaders() } }
  );
}

export async function submitSubmission(submissionId) {
  return axios.post(
    `${API_BASE}/fiche-submissions/${submissionId}/submit`,
    {},
    { headers: { ...getAuthHeaders() } }
  );
}
export async function getSubmissionById(submissionId) {
  return axios.get(
    `${API_BASE}/fiche-submissions/${submissionId}`,
    { headers: { ...getAuthHeaders() } }
  );
}

