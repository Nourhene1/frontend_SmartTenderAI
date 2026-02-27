// src/app/services/application.api.js

export const uploadCvToJob = async (jobId, file) => {
  const form = new FormData();
  form.append("cv", file);

  const res = await fetch(
    `http://localhost:5000/api/applications/${jobId}/cv`,
    {
      method: "POST",
      body: form,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Upload échoué");
  }

  return data;
};

export const confirmCandidature = async (
  candidatureId,
  parsed,
  manual,
  personalInfoForm
) => {
  const res = await fetch(
    `http://localhost:5000/api/applications/${candidatureId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parsed, manual, personalInfoForm }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    // ✅ FIX: on attache status + data à l'erreur pour que StepManual
    // puisse détecter le code ALREADY_SUBMITTED et afficher le bon message
    const err = new Error(data.message || "Submit failed");
    err.status = res.status;   // ← 409
    err.data   = data;         // ← { code: "ALREADY_SUBMITTED", message: "..." }
    throw err;
  }

  return data;
};

// ✅ update infos personnelles du candidat
export const updatePersonalInfo = async (candidatureId, personalInfoForm) => {
  const res = await fetch(
    `http://localhost:5000/candidatures/${candidatureId}/personal-info`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(personalInfoForm),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Update personal info failed");
  }

  return data;
};