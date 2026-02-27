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
    { responseType: "blob" }   // ✅ IMPORTANT: blob pour recevoir le .docx
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
    { responseType: "blob" }   // ✅ IMPORTANT: blob pour recevoir le .docx
  );
  return res;
};

/* =========================================================
   GET /documents/history
========================================================= */
export const getDocumentHistory = () => api.get("/documents/history");