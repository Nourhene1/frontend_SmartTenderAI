"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timer, CheckCircle, Trash2, ArrowLeft } from "lucide-react";
import { createFiche, updateFiche, getFicheById } from "@/app/services/fiche.api";

/* ================= HELPERS ================= */
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random();

const defaultScale = {
  min: 0,
  max: 4,
  labels: {
    0: "Néant",
    1: "Débutant",
    2: "Intermédiaire",
    3: "Avancé",
    4: "Expert",
  },
};

const createQuestion = () => ({
  id: uid(),
  label: "",
  type: "text",
  required: false,
  timeLimit: 0,
  options: [],
  items: [],
  scale: null,
});

const createOption = () => ({
  id: uid(),
  label: "",
  hasText: false,
  otherLabel: "",
  otherType: "text",
});

const createItem = () => ({ id: uid(), label: "" });

function ensureIds(questions = []) {
  return questions.map((q) => ({
    ...createQuestion(),
    ...q,
    id: q.id || uid(),
    options: (q.options || []).map((o) => ({
      ...createOption(),
      ...o,
      id: o.id || uid(),
    })),
    items: (q.items || []).map((it) => ({
      ...createItem(),
      ...it,
      id: it.id || uid(),
    })),
    scale: q.type === "scale_group" ? { ...defaultScale, ...(q.scale || {}) } : null,
  }));
}

/* ================= COMPONENT ================= */
export default function FicheRenseignementBuilder() {
  const router = useRouter();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("Fiche de renseignement");
  const [description, setDescription] = useState("");
  const [enableQuestions, setEnableQuestions] = useState(true);
  const [questions, setQuestions] = useState([createQuestion()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await getFicheById(id);
        const fiche = res?.data?.fiche || res?.data;
        setTitle(fiche?.title || "");
        setDescription(fiche?.description || "");
        const qs = ensureIds(fiche?.questions || []);
        setQuestions(qs.length ? qs : [createQuestion()]);
        setEnableQuestions((fiche?.questions || []).length > 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  /* ================= QUESTION CRUD ================= */
  const addQuestion = () => setQuestions((p) => [...p, createQuestion()]);
  const removeQuestion = (qid) => setQuestions((p) => p.filter((q) => q.id !== qid));
  const updateQuestion = (qid, patch) =>
    setQuestions((p) => p.map((q) => (q.id === qid ? { ...q, ...patch } : q)));

  function onTypeChange(qid, type) {
    updateQuestion(qid, {
      type,
      options: type === "radio" || type === "checkbox" ? [createOption()] : [],
      items: type === "scale_group" ? [createItem()] : [],
      scale: type === "scale_group" ? { ...defaultScale } : null,
    });
  }

  /* ================= OPTIONS ================= */
  const addOption = (qid) =>
    setQuestions((p) =>
      p.map((q) => (q.id === qid ? { ...q, options: [...q.options, createOption()] } : q))
    );

  const updateOption = (qid, oid, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: q.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)),
            }
          : q
      )
    );

  const removeOption = (qid, oid) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid ? { ...q, options: q.options.filter((o) => o.id !== oid) } : q
      )
    );

  /* ================= SCALE ITEMS ================= */
  const addItem = (qid) =>
    setQuestions((p) => p.map((q) => (q.id === qid ? { ...q, items: [...q.items, createItem()] } : q)));

  const updateItem = (qid, iid, patch) =>
    setQuestions((p) =>
      p.map((q) =>
        q.id === qid
          ? { ...q, items: q.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) }
          : q
      )
    );

  const removeItem = (qid, iid) =>
    setQuestions((p) =>
      p.map((q) => (q.id === qid ? { ...q, items: q.items.filter((it) => it.id !== iid) } : q))
    );

  /* ================= SUBMIT ================= */
  async function submit() {
    if (saving) return;

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        questions: enableQuestions ? questions : [],
      };

      let response;
      if (isEdit) {
        response = await updateFiche(id, payload);
      } else {
        response = await createFiche(payload);
      }

      if (response && (response.status === 200 || response.status === 201)) {
        window.location.href = "/recruiter/fiche-renseignement";
      } else {
        throw new Error("Réponse invalide du serveur");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);

      if (error.response) {
        alert(`Erreur: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        alert("Erreur de connexion au serveur");
      } else {
        alert("Une erreur est survenue");
      }

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* ===== HEADER ===== */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {isEdit ? "Modifier la fiche" : "Créer une fiche de renseignement"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Définissez le titre, la description, puis ajoutez vos questions.
            </p>
          </div>
          <button
            onClick={() => router.push("/recruiter/fiche-renseignement")}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl 
                       border-2 border-green-500 dark:border-emerald-500 
                       text-green-600 dark:text-emerald-400 
                       bg-white dark:bg-gray-800 
                       hover:bg-green-50 dark:hover:bg-gray-700 
                       hover:border-green-600 dark:hover:border-emerald-400 
                       transition-colors font-medium text-sm sm:text-base 
                       w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* ===== INFORMATIONS GÉNÉRALES ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow border border-green-100 dark:border-gray-700 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-emerald-500"></div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                Informations générales
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Activer les questions
              </span>
              <input
                type="checkbox"
                checked={enableQuestions}
                onChange={(e) => setEnableQuestions(e.target.checked)}
                className="w-5 h-5 text-green-600 dark:text-emerald-500 rounded focus:ring-green-500 dark:focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mb-4 sm:mb-5">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre de la fiche
            </label>
            <input
              className="w-full rounded-full border border-green-200 dark:border-gray-600 
                         bg-white dark:bg-gray-700 
                         text-gray-800 dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-500
                         px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base
                         focus:border-green-500 dark:focus:border-emerald-500 
                         focus:ring-1 focus:ring-green-500 dark:focus:ring-emerald-500 
                         outline-none transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-2xl sm:rounded-3xl border border-green-200 dark:border-gray-600 
                         bg-white dark:bg-gray-700 
                         text-gray-800 dark:text-white 
                         placeholder-gray-400 dark:placeholder-gray-500
                         px-4 sm:px-5 py-3 sm:py-4 resize-none text-sm sm:text-base
                         focus:border-green-500 dark:focus:border-emerald-500 
                         focus:ring-1 focus:ring-green-500 dark:focus:ring-emerald-500 
                         outline-none transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* ===== QUESTIONS ===== */}
        {enableQuestions &&
          questions.map((q, i) => (
            <div
              key={q.id}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow space-y-3 sm:space-y-4 border border-green-100 dark:border-gray-700 transition-colors duration-300"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-green-600 dark:text-emerald-400 font-semibold text-sm sm:text-base">
                  QUESTION {i + 1}
                </span>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  aria-label="Supprimer la question"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Libellé */}
              <input
                className="w-full border border-green-200 dark:border-gray-600 
                           bg-white dark:bg-gray-700 
                           text-gray-800 dark:text-white 
                           placeholder-gray-400 dark:placeholder-gray-500
                           rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base
                           focus:border-green-500 dark:focus:border-emerald-500 
                           focus:ring-1 focus:ring-green-500 dark:focus:ring-emerald-500 
                           outline-none transition-colors"
                placeholder="Libellé de la question"
                value={q.label}
                onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
              />

              {/* Type + Obligatoire + Timer */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm mb-1 font-medium text-gray-700 dark:text-gray-300">
                    Type de réponse
                  </label>

                  <select
                    value={q.type}
                    onChange={(e) => onTypeChange(q.id, e.target.value)}
                    className="border rounded-xl px-3 py-2 
                               border-green-200 dark:border-gray-600 
                               bg-white dark:bg-gray-700 
                               text-gray-800 dark:text-white 
                               text-sm sm:text-base
                               focus:border-green-500 dark:focus:border-emerald-500 
                               outline-none transition-colors"
                  >
                    <option value="text">Texte</option>
                    <option value="number8">Nombre (8 chiffres)</option>
                    <option value="textarea">Paragraphe</option>
                    <option value="radio">Choix unique</option>
                    <option value="checkbox">Choix multiple</option>
                    <option value="scale_group">Code de niveau</option>
                  </select>

                  {/* Helper pour number8 */}
                  {q.type === "number8" && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Ce type attend <span className="font-semibold">exactement 8 chiffres</span>.
                    </div>
                  )}

                  {q.type === "scale_group" && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Niveaux :
                      <span className="font-medium ml-1">
                        0 = Néant · 1 = Débutant · 2 = Intermédiaire · 3 = Avancé · 4 = Expert
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center sm:items-end gap-3 sm:gap-4">
                  <label className="flex items-center gap-2 sm:pb-2">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                      className="w-4 h-4 text-green-600 dark:text-emerald-500 rounded"
                    />
                    <span className="text-xs sm:text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                      Obligatoire
                    </span>
                  </label>

                  <div className="flex-1 sm:flex-none">
                    <label className="flex items-center gap-1 text-xs sm:text-sm mb-1 text-gray-700 dark:text-gray-300">
                      <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                      <span>secondes</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full sm:w-32 border rounded-xl px-3 py-2 
                                 border-green-200 dark:border-gray-600 
                                 bg-white dark:bg-gray-700 
                                 text-gray-800 dark:text-white 
                                 text-sm sm:text-base
                                 focus:border-green-500 dark:focus:border-emerald-500 
                                 outline-none transition-colors"
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(q.id, { timeLimit: Number(e.target.value || 0) })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ===== APERÇU CHAMP (TEXT, TEXTAREA, NUMBER8) ===== */}
              {(q.type === "text" || q.type === "textarea" || q.type === "number8") && (
                <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aperçu du champ
                  </label>
                  
                  {q.type === "text" && (
                    <input
                      type="text"
                      disabled
                      placeholder="Réponse courte..."
                      className="w-full border rounded-lg px-3 py-2 
                                 border-gray-300 dark:border-gray-500 
                                 bg-white dark:bg-gray-600 
                                 text-gray-600 dark:text-gray-400 
                                 placeholder-gray-400 dark:placeholder-gray-500
                                 text-sm
                                 opacity-60"
                    />
                  )}

                  {q.type === "textarea" && (
                    <textarea
                      disabled
                      placeholder="Réponse longue..."
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 
                                 border-gray-300 dark:border-gray-500 
                                 bg-white dark:bg-gray-600 
                                 text-gray-600 dark:text-gray-400 
                                 placeholder-gray-400 dark:placeholder-gray-500
                                 text-sm
                                 resize-none
                                 opacity-60"
                    />
                  )}

                  {q.type === "number8" && (
                    <input
                      type="text"
                      disabled
                      placeholder="00000000"
                      maxLength="8"
                      className="w-full border rounded-lg px-3 py-2 
                                 border-gray-300 dark:border-gray-500 
                                 bg-white dark:bg-gray-600 
                                 text-gray-600 dark:text-gray-400 
                                 placeholder-gray-400 dark:placeholder-gray-500
                                 text-sm
                                 font-mono
                                 opacity-60"
                    />
                  )}
                </div>
              )}

              {/* ===== OPTIONS RADIO / CHECKBOX ===== */}
              {(q.type === "radio" || q.type === "checkbox") && (
                <div className="space-y-3 sm:space-y-4">
                  {q.options.map((o) => (
                    <div
                      key={o.id}
                      className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-700/30"
                    >
                      {/* Ligne option + supprimer */}
                      <div className="flex gap-2 sm:gap-3 items-center">
                        <input
                          className="flex-1 border rounded-xl px-3 py-2 
                                     border-green-200 dark:border-gray-600 
                                     bg-white dark:bg-gray-700 
                                     text-gray-800 dark:text-white 
                                     placeholder-gray-400 dark:placeholder-gray-500
                                     text-sm sm:text-base
                                     focus:border-green-500 dark:focus:border-emerald-500 
                                     outline-none transition-colors"
                          placeholder="Option"
                          value={o.label}
                          onChange={(e) => updateOption(q.id, o.id, { label: e.target.value })}
                        />
                        <button
                          onClick={() => removeOption(q.id, o.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
                          aria-label="Supprimer l'option"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Checkbox "Ajouter un champ pour cette option" */}
                      <div className="flex items-center gap-2 ml-1">
                        <input
                          type="checkbox"
                          id={`hasText-${o.id}`}
                          checked={o.hasText || false}
                          onChange={(e) =>
                            updateOption(q.id, o.id, {
                              hasText: e.target.checked,
                              otherLabel: e.target.checked ? o.otherLabel : "",
                              otherType: e.target.checked ? o.otherType : "text",
                            })
                          }
                          className="w-4 h-4 text-green-600 dark:text-emerald-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label
                          htmlFor={`hasText-${o.id}`}
                          className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                        >
                          Ajouter un champ pour cette option
                        </label>
                      </div>

                      {/* Champ conditionnel : label + type */}
                      {o.hasText && (
                        <div className="ml-6 mt-1 flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-700 border border-green-200 dark:border-emerald-700 rounded-xl">
                          <div className="flex items-center gap-1 text-green-600 dark:text-emerald-400 text-xs font-semibold shrink-0">
                            <span>↳</span>
                            <span>Champ lié</span>
                          </div>

                          <input
                            className="flex-1 border rounded-lg px-3 py-1.5 
                                       border-green-200 dark:border-gray-600 
                                       bg-white dark:bg-gray-600 
                                       text-gray-800 dark:text-white 
                                       placeholder-gray-400 dark:placeholder-gray-400
                                       text-xs sm:text-sm
                                       focus:border-green-500 dark:focus:border-emerald-500 
                                       outline-none transition-colors"
                            placeholder='Ex: "Date d obtention", "Nombre d enfants"...'
                            value={o.otherLabel || ""}
                            onChange={(e) => updateOption(q.id, o.id, { otherLabel: e.target.value })}
                          />

                          <select
                            value={o.otherType || "text"}
                            onChange={(e) => updateOption(q.id, o.id, { otherType: e.target.value })}
                            className="border rounded-lg px-3 py-1.5 
                                       border-green-200 dark:border-gray-600 
                                       bg-white dark:bg-gray-600 
                                       text-gray-800 dark:text-white 
                                       text-xs sm:text-sm
                                       focus:border-green-500 dark:focus:border-emerald-500 
                                       outline-none transition-colors shrink-0"
                          >
                            <option value="text">Texte</option>
                            <option value="number8">Nombre (8 chiffres)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addOption(q.id)}
                    className="text-green-600 dark:text-emerald-400 text-xs sm:text-sm hover:text-green-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    + Ajouter une option
                  </button>
                </div>
              )}

              {/* ===== ITEMS SCALE GROUP ===== */}
              {q.type === "scale_group" && (
                <div className="space-y-2 sm:space-y-3">
                  {q.items.map((it) => (
                    <div key={it.id} className="flex gap-2 sm:gap-3 items-center">
                      <input
                        className="flex-1 border rounded-xl px-3 py-2 
                                   border-green-200 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 
                                   text-gray-800 dark:text-white 
                                   placeholder-gray-400 dark:placeholder-gray-500
                                   text-sm sm:text-base
                                   focus:border-green-500 dark:focus:border-emerald-500 
                                   outline-none transition-colors"
                        placeholder="Ligne"
                        value={it.label}
                        onChange={(e) => updateItem(q.id, it.id, { label: e.target.value })}
                      />
                      <button
                        onClick={() => removeItem(q.id, it.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(q.id)}
                    className="text-green-600 dark:text-emerald-400 text-xs sm:text-sm hover:text-green-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    + Ajouter une ligne
                  </button>
                </div>
              )}
            </div>
          ))}

        {/* ===== AJOUTER QUESTION ===== */}
        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 
                     py-3 sm:py-4 rounded-xl 
                     text-gray-600 dark:text-gray-400 font-medium 
                     hover:border-green-400 dark:hover:border-emerald-500 
                     hover:text-green-600 dark:hover:text-emerald-400 
                     transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Ajouter une question
        </button>

        {/* ===== ACTIONS ===== */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => router.push("/recruiter/fiche-renseignement")}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 
                       bg-white dark:bg-gray-800 
                       text-gray-700 dark:text-gray-300 
                       border-2 border-gray-300 dark:border-gray-600 
                       rounded-xl font-semibold 
                       hover:bg-gray-50 dark:hover:bg-gray-700 
                       hover:border-gray-400 dark:hover:border-gray-500 
                       transition-colors 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       text-sm sm:text-base"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 
                       bg-green-600 dark:bg-emerald-600 
                       text-white rounded-xl font-semibold 
                       hover:bg-green-700 dark:hover:bg-emerald-500 
                       transition-colors 
                       disabled:bg-gray-400 dark:disabled:bg-gray-600 
                       disabled:cursor-not-allowed 
                       text-sm sm:text-base"
          >
            {saving ? "Enregistrement..." : "Enregistrer la fiche"}
          </button>
        </div>
      </div>
    </div>
  );
}