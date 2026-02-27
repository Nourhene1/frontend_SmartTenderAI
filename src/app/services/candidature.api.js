import api from "./api";
import axios from "axios"; // ✅ OBLIGATOIRE
export const getCondidature = () => api.get("/candidatures");
export const getCandidaturesWithJob = () => api.get("/candidatures/with-job");
export const getCondidatureCount = () => api.get("/candidatures/count");
export const getCandidaturesAnalysis = () => api.get("/candidatures/analysis");
export const getMyCandidatures = () => api.get("/candidatures/my");
export const getMatchingStats = () => api.get("/candidatures/stats/matching");
export const getAcademicStats = () => api.get("/candidatures/stats/academic");

// ── Pré-entretien ──────────────────────────────────────────────
export const togglePreInterview = (id, currentValue) =>
  api.patch(`/candidatures/${id}/pre-interview`, { preInterview: !currentValue });

export const getPreInterviewList = () =>
  api.get("/candidatures/pre-interview");

//

export const getPreInterviewCandidates = async () => {
  const { data } = await axios.get(
    `${API_URL}/candidatures/preinterview`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return data;
};
