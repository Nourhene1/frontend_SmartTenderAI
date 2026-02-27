"use client";

import { useState } from "react";
import { uploadCvToJob } from "../../../../services/application.api";

export default function StepUploadCV({ jobId, onParsed }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function upload() {
    if (!file) {
      setErr("Veuillez sélectionner un CV au format PDF.");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const data = await uploadCvToJob(jobId, file); // ✅ upload + extraction
      onParsed(data);
    } catch (e) {
      setErr(e?.message || "Erreur lors de l’upload du CV.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ===== TITLE ===== */}
      <h2
        data-cy="apply-step1-title"
        className="text-3xl font-extrabold text-center mb-2 text-gray-900 dark:text-white"
      >
        Étape 1 — Upload du CV
      </h2>

      <p
        data-cy="apply-step1-subtitle"
        className="text-gray-600 dark:text-gray-400 text-center mb-8"
      >
        Déposez votre CV. Les informations seront extraites automatiquement.
      </p>

      {/* ===== UPLOAD CARD ===== */}
      <label
        data-cy="upload-card"
        htmlFor="cv"
        className="flex flex-col items-center justify-center
                   border-2 border-dashed border-green-400 dark:border-emerald-600
                   rounded-2xl p-12 text-center cursor-pointer
                   bg-green-50 dark:bg-emerald-950/30
                   hover:bg-green-100 dark:hover:bg-emerald-950/50
                   transition"
      >
        <input
          data-cy="cv-input"
          id="cv"
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            const selected = e.target.files?.[0];
            setFile(selected || null);
            setErr(""); // reset error when choosing file
          }}
        />

        <div className="text-4xl mb-3">📄</div>

        <p className="font-medium text-gray-700 dark:text-gray-200">
          Glissez-déposez votre CV ici
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ou cliquez pour sélectionner un fichier
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Format accepté : <b>PDF uniquement</b>
        </p>

        {/* Selected file name */}
        {file && (
          <p
            data-cy="selected-file-name"
            className="mt-4 text-sm text-green-600 dark:text-emerald-400 font-medium"
          >
            ✔ {file.name}
          </p>
        )}
      </label>

      {/* Error */}
      {err && (
        <p
          data-cy="upload-error"
          className="text-red-500 dark:text-red-400 text-sm text-center mt-4"
        >
          {err}
        </p>
      )}

      {/* Submit */}
      <div className="mt-10 flex justify-center">
        <button
          data-cy="submit-cv-btn"
          onClick={upload}
          disabled={loading}
          className="px-10 py-3 rounded-xl bg-green-600 dark:bg-emerald-600 text-white
                     font-semibold hover:bg-green-700 dark:hover:bg-emerald-500
                     disabled:opacity-50 transition"
        >
          {loading ? "Votre CV est en cours de traitement..." : "Soumettre le CV"}
        </button>
      </div>
    </>
  );
}