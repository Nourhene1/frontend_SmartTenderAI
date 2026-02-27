// calendar.api.js
import api from "./api"; // ✅ adapte le chemin si ton api.js est ailleurs

/* =========================================================
   CALENDAR / INTERVIEWS (Backend mount: /api)
========================================================= */

/** RH: créer entretien (Outlook + DB + email candidat) */
export function createInterviewEvent(payload) {
  // POST http://localhost:5000/api/calendar/events/interview
  return api.post("/api/calendar/events/interview", payload);
}

/** RH: récupérer créneaux dispo 10h/11h (10h-12h) */
export function getRhSlots() {
  // GET http://localhost:5000/api/calendar/rh-slots
  return api.get("/api/calendar/rh-slots");
}

/** CANDIDAT: récupérer infos de confirmation (affichage page) */
export function getConfirmInfo(confirmToken) {
  // GET http://localhost:5000/api/calendar/interview/confirm/:confirmToken
  return api.get(`/api/calendar/interview/confirm/${confirmToken}`);
}

/** CANDIDAT: confirmer entretien */
export function confirmInterview(confirmToken) {
  // POST http://localhost:5000/api/calendar/interview/confirm/:confirmToken
  return api.post(`/api/calendar/interview/confirm/${confirmToken}`);
}

/** CANDIDAT: demander reschedule + raison */
export function rescheduleInterview(rescheduleToken, reason) {
  // POST http://localhost:5000/api/calendar/interview/reschedule/:rescheduleToken
  return api.post(`/api/calendar/interview/reschedule/${rescheduleToken}`, {
    reason: reason || "",
  });
}
export function getRescheduleInfo(rescheduleToken) {
  return api.get(`/api/calendar/interview/reschedule/${rescheduleToken}`);
}

// ✅ recruiter page
export function getInterviewById(interviewId) {
  return api.get(`/api/calendar/interview/${interviewId}`);
}

export function getRecruiterFreeSlots(interviewId) {
  // backend: GET /api/calendar/interview/:id/free-slots
  return api.get(`/api/calendar/interview/${interviewId}/free-slots`);
}

export function recruiterProposeNewSlot(interviewId, startISO) {
  // backend: POST /api/calendar/interview/:id/propose  body: { startISO }
  return api.post(`/api/calendar/interview/${interviewId}/propose`, { startISO });}

  export function getRhTechSlots({ candidatureId, jobOfferId, days = 7 }) {
  return axios.get(`${API_URL}/calendar/rh-tech-slots`, {
    headers: authHeaders(),
    params: { candidatureId, jobOfferId, days },
  });
}

export function proposeRhTechInterview({ candidatureId, jobOfferId, proposedDate, proposedTime }) {
  return axios.post(
    `${API_URL}/calendar/rh-tech/schedule`,
    { candidatureId, jobOfferId, proposedDate, proposedTime },
    { headers: authHeaders() }
  );
}

// email-confirm pages (no auth generally needed)
export function managerConfirmRhTech(token) {
  return axios.post(`${API_URL}/calendar/rh-tech/manager/confirm/${token}`);
}

export function managerProposeRhTech(token, { proposedDate, proposedTime }) {
  return axios.post(`${API_URL}/calendar/rh-tech/manager/propose/${token}`, {
    proposedDate,
    proposedTime,
  });
}

export function candidateConfirmRhTech(token) {
  return axios.post(`${API_URL}/calendar/rh-tech/candidate/confirm/${token}`);
}

export function candidateProposeRhTech(token, { proposedDate, proposedTime }) {
  return axios.post(`${API_URL}/calendar/rh-tech/candidate/propose/${token}`, {
    proposedDate,
    proposedTime,
  });
}