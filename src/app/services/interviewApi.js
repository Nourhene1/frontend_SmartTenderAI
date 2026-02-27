const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ============================================================
 *  INTERVIEW API SERVICE
 * ============================================================
 *
 *  FLOW :
 *  1. Admin planifie              → scheduleInterview()
 *  2. ResponsableMetier confirme  → confirmInterview()
 *  2b. ResponsableMetier modifie  → modifyInterview() → mail admin
 *  3. Candidat confirme           → candidateConfirmInterview()
 *  3b. Candidat propose date      → candidateReschedule()
 *  4. Admin approuve/rejette      → adminApprove() / adminReject()
 *
 * ============================================================ */

// ──────────────────────────────────────────────
//  Helper : fetch wrapper
// ──────────────────────────────────────────────
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json();
  return data;
}

// ══════════════════════════════════════════════
//  ÉTAPE 1 : Admin planifie l'entretien
// ══════════════════════════════════════════════
export async function scheduleInterview({
  candidatureId,
  jobOfferId,
  candidateEmail,
  candidateName,
  proposedDate,
  proposedTime,
  notes,
}) {
  return request("/api/interviews/schedule", {
    method: "POST",
    body: JSON.stringify({
      candidatureId,
      jobOfferId,
      candidateEmail,
      candidateName,
      proposedDate,
      proposedTime,
      notes,
    }),
  });
}

// ══════════════════════════════════════════════
//  ÉTAPE 2 : ResponsableMetier
// ══════════════════════════════════════════════

/** GET - Charger les détails de l'entretien (page responsable) */
export async function getInterviewByToken(token) {
  return request(`/api/interviews/confirm/${token}`);
}

/** POST - Responsable confirme la date */
export async function confirmInterview(token, { confirmedDate, confirmedTime, notes, location }) {
  return request(`/api/interviews/confirm/${token}`, {
    method: "POST",
    body: JSON.stringify({ confirmedDate, confirmedTime, notes, location }),
  });
}

/** POST - Responsable demande une modification (→ mail admin, PAS candidat) */
export async function modifyInterview(token, { newDate, newTime, notes }) {
  return request(`/api/interviews/modify/${token}`, {
    method: "POST",
    body: JSON.stringify({ newDate, newTime, notes }),
  });
}

// ══════════════════════════════════════════════
//  ÉTAPE 3 : Candidat
// ══════════════════════════════════════════════

/** GET - Charger les détails (page candidat) */
export async function getCandidateInterview(candidateToken) {
  return request(`/api/interviews/candidate/${candidateToken}`);
}

/** POST - Candidat confirme l'entretien */
export async function candidateConfirmInterview(candidateToken) {
  return request(`/api/interviews/candidate/${candidateToken}/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** POST - Candidat propose une autre date */
export async function candidateReschedule(candidateToken, { proposedDate, proposedTime, reason }) {
  return request(`/api/interviews/candidate/${candidateToken}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ proposedDate, proposedTime, reason }),
  });
}

// ══════════════════════════════════════════════
//  ADMIN : Gestion des modifications
// ══════════════════════════════════════════════

/** POST - Admin approuve la modification du responsable */
export async function adminApproveModification(interviewId) {
  return request(`/api/interviews/admin/approve/${interviewId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** POST - Admin rejette la modification du responsable */
export async function adminRejectModification(interviewId, reason) {
  return request(`/api/interviews/admin/reject/${interviewId}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ══════════════════════════════════════════════
//  CONSULTATION
// ══════════════════════════════════════════════

/** Entretiens par candidature */
export async function getInterviewsByCandidature(candidatureId) {
  return request(`/api/interviews/candidature/${candidatureId}`);
}

/** Entretiens par offre */
export async function getInterviewsByJobOffer(jobOfferId) {
  return request(`/api/interviews/job/${jobOfferId}`);
}

/** Entretiens par utilisateur */
export async function getInterviewsByUser(userId) {
  return request(`/api/interviews/user/${userId}`);
}

/** Entretiens à venir */
export async function getUpcomingInterviews() {
  return request(`/api/interviews/upcoming`);
}

// ══════════════════════════════════════════════
//  ANNULATION
// ══════════════════════════════════════════════

/** Annuler un entretien */
export async function cancelInterview(interviewId, reason) {
  return request(`/api/interviews/${interviewId}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}