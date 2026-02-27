// services/document.api.js
import api from "./api";

/* =========================================================
   POST /documents/generate-response
   Body: { tenderId, candidateIds: [], companyInfo? }
   → retourne un blob .docx
========================================================= */
export const generateResponseDocument = async (tenderId, candidateIds, companyInfo) => {
  const res = await api.post(
    "/documents/generate-response",
    { tenderId, candidateIds, companyInfo },
    { responseType: "blob" }
  );
  return res;
};

/* =========================================================
   POST /documents/generate-profile
   Body: { candidateId, tenderId? }
   → retourne un blob .docx
========================================================= */
export const generateCandidateProfile = async (candidateId, tenderId) => {
  const res = await api.post(
    "/documents/generate-profile",
    { candidateId, tenderId },
    { responseType: "blob" }
  );
  return res;
};

/* =========================================================
   GET /documents/history
========================================================= */
export const getDocumentHistory = () => api.get("/documents/history");

/* =========================================================
   ✅ GET /documents/:id/download
   → retourne un blob .docx pour re-télécharger depuis l'historique
========================================================= */
export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, { responseType: "blob" });