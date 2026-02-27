"use client";

import { useMemo, useState } from "react";

/* =======================
   HELPERS
======================= */
function safeStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

export function cleanEmail(email) {
  if (!email) return "";
  return String(email)
    .replaceAll("envel⌢pe", "")
    .replaceAll("/envel⌢pe", "")
    .replaceAll("envelope", "")
    .replaceAll(" ", "")
    .trim();
}

function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v];
}

function uniqCleanSkills(skills) {
  const seen = new Set();
  return safeArr(skills)
    .map((s) => safeStr(s))
    .filter((s) => s.length > 0)
    .filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function getPercentFromLevel(level) {
  const v = safeStr(level).toLowerCase();
  if (!v) return 0;

  const m = v.match(/(\d{1,3})\s*%/);
  if (m) return clamp(m[1], 0, 100);

  const num = Number(v);
  if (Number.isFinite(num)) {
    if (num >= 0 && num <= 1) return Math.round(num * 100);
    if (num >= 0 && num <= 100) return Math.round(num);
  }

  return 0;
}

/* =======================
   COMPONENT
======================= */
export default function StepManual({ parsedCV, cvFileUrl, onBack, onSubmit }) {
  const initial = useMemo(() => {
    const p = parsedCV || {};

    const fixedEmail = cleanEmail(safeStr(p.email));

    return {
      personal_info: {
        full_name: safeStr(p.nom),
        email: fixedEmail,
        phone: safeStr(p.telephone),
        address: safeStr(p.adresse),
        job_title: safeStr(p.titre_poste),
        linkedin: safeStr(p?.reseaux_sociaux?.linkedin),
        github: safeStr(p?.reseaux_sociaux?.github),

        date_naissance: safeStr(p?.personal_info?.date_naissance),
        lieu_naissance: safeStr(p?.personal_info?.lieu_naissance),

      },

      personal_info_extra: safeArr(p.personal_info_extra),

      profile: safeStr(p.profil),

      skills: uniqCleanSkills([
        ...safeArr(p?.competences?.langages_programmation),
        ...safeArr(p?.competences?.frameworks),
        ...safeArr(p?.competences?.outils),
        ...safeArr(p?.competences?.bases_donnees),
        ...safeArr(p?.competences?.autres),
        ...safeArr(p?.competences?.all),
      ]),

      education: safeArr(p.formation).map((edu) => ({
        degree: safeStr(edu?.diplome),
        institution: safeStr(edu?.etablissement),
        period: safeStr(edu?.periode),
      })),

      experience: safeArr(p.experience_professionnelle).map((exp) => ({
        role: safeStr(exp?.poste),
        company: safeStr(exp?.entreprise),
        period: safeStr(exp?.periode),
        location: safeStr(exp?.lieu),
        description: safeStr(exp?.description),
      })),

      projects: safeArr(p.projets).map((pr) => ({
        name: safeStr(pr?.nom),
        description: safeStr(pr?.description),
        technologies: safeArr(pr?.technologies).map((t) => safeStr(t)),
      })),

      certifications: safeArr(p.certifications).map((c) => ({
        name: safeStr(c?.nom),
        org: safeStr(c?.organisme),
        date: safeStr(c?.date),
      })),

      languages: safeArr(p.langues).map((l) => ({
        name: safeStr(l?.langue),
        level: safeStr(l?.niveau),
      })),

      interests: safeArr(p.activites).map((x) => safeStr(x)),
    };
  }, [parsedCV]);

  const [form, setForm] = useState(initial);
  const [sectionIndex, setSectionIndex] = useState(0);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [newSkill, setNewSkill] = useState("");

  /* =======================
     CRUD FUNCTIONS
  ======================= */
  const addEducation = () => {
    setForm((prev) => ({
      ...prev,
      education: [
        ...safeArr(prev.education),
        { degree: "", institution: "", period: "" },
      ],
    }));
  };

  const removeEducation = (i) => {
    setForm((prev) => ({
      ...prev,
      education: safeArr(prev.education).filter((_, idx) => idx !== i),
    }));
  };

  const updateEducation = (i, field, value) => {
    setForm((prev) => {
      const arr = [...safeArr(prev.education)];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, education: arr };
    });
  };

  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...safeArr(prev.experience),
        { role: "", company: "", period: "", location: "", description: "" },
      ],
    }));
  };

  const removeExperience = (i) => {
    setForm((prev) => ({
      ...prev,
      experience: safeArr(prev.experience).filter((_, idx) => idx !== i),
    }));
  };

  const updateExperience = (i, field, value) => {
    setForm((prev) => {
      const arr = [...safeArr(prev.experience)];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, experience: arr };
    });
  };

  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...safeArr(prev.projects),
        { name: "", description: "", technologies: [] },
      ],
    }));
  };

  const removeProject = (i) => {
    setForm((prev) => ({
      ...prev,
      projects: safeArr(prev.projects).filter((_, idx) => idx !== i),
    }));
  };

  const updateProject = (i, field, value) => {
    setForm((prev) => {
      const arr = [...safeArr(prev.projects)];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, projects: arr };
    });
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: safeArr(prev.skills).filter((s) => s !== skill),
    }));
  };

  const addSkill = (skill) => {
    const s = safeStr(skill);
    if (!s) return;
    setForm((prev) => ({
      ...prev,
      skills: uniqCleanSkills([...safeArr(prev.skills), s]),
    }));
  };

  const addCertification = () => {
    setForm((prev) => ({
      ...prev,
      certifications: [
        ...safeArr(prev.certifications),
        { name: "", org: "", date: "" },
      ],
    }));
  };

  const removeCertification = (i) => {
    setForm((prev) => ({
      ...prev,
      certifications: safeArr(prev.certifications).filter((_, idx) => idx !== i),
    }));
  };

  const updateCertification = (i, field, value) => {
    setForm((prev) => {
      const arr = [...safeArr(prev.certifications)];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, certifications: arr };
    });
  };

  const addLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [...safeArr(prev.languages), { name: "", level: "" }],
    }));
  };

  const removeLanguage = (i) => {
    setForm((prev) => ({
      ...prev,
      languages: safeArr(prev.languages).filter((_, idx) => idx !== i),
    }));
  };

  const updateLanguage = (i, field, value) => {
    setForm((prev) => {
      const arr = [...safeArr(prev.languages)];
      arr[i] = { ...arr[i], [field]: value };
      return { ...prev, languages: arr };
    });
  };

  const addPersonalExtra = () => {
    setForm((prev) => ({
      ...prev,
      personal_info_extra: [
        ...safeArr(prev.personal_info_extra),
        { label: "", value: "" },
      ],
    }));
  };

  /* =======================
     SUBMIT FINAL
  ======================= */
  async function handleSubmitFinal() {
    const payload = {
      nom: safeStr(form.personal_info.full_name),
      email: cleanEmail(safeStr(form.personal_info.email)),
      telephone: safeStr(form.personal_info.phone),
      adresse: safeStr(form.personal_info.address),
      titre_poste: safeStr(form.personal_info.job_title),
      profil: safeStr(form.profile),

      personal_info: {
        date_naissance: safeStr(form.personal_info.date_naissance),
        lieu_naissance: safeStr(form.personal_info.lieu_naissance),
      },

      reseaux_sociaux: {
        linkedin: safeStr(form.personal_info.linkedin),
        github: safeStr(form.personal_info.github),
      },

      personal_info_extra: safeArr(form.personal_info_extra).map((x) => ({
        label: safeStr(x.label),
        value: safeStr(x.value),
      })),

      formation: safeArr(form.education).map((e) => ({
        diplome: safeStr(e.degree),
        etablissement: safeStr(e.institution),
        periode: safeStr(e.period),
      })),

      experience_professionnelle: safeArr(form.experience).map((e) => ({
        poste: safeStr(e.role),
        entreprise: safeStr(e.company),
        lieu: safeStr(e.location),
        periode: safeStr(e.period),
        description: safeStr(e.description),
      })),

      competences: { all: safeArr(form.skills) },

      projets: safeArr(form.projects).map((p) => ({
        nom: safeStr(p.name),
        description: safeStr(p.description),
        technologies: safeArr(p.technologies),
      })),

      certifications: safeArr(form.certifications).map((c) => ({
        nom: safeStr(c.name),
        organisme: safeStr(c.org),
        date: safeStr(c.date),
      })),

      langues: safeArr(form.languages).map((l) => ({
        langue: safeStr(l.name),
        niveau: safeStr(l.level),
      })),

      activites: safeArr(form.interests),
    };

    try {
      setLoadingSubmit(true);
      setSuccessMsg("");
      setErrorMsg("");

      await onSubmit(payload);

      setSuccessMsg("Votre candidature a été envoyée avec succès !");
    } catch (e) {
      // ✅ Gestion spéciale : email déjà utilisé pour cette offre
      const status = e?.response?.status || e?.status;
      const code = e?.response?.data?.code || e?.data?.code;

      if (status === 409 || code === "ALREADY_SUBMITTED" || code === "EMAIL_ALREADY_APPLIED") {
        setErrorMsg(
          "❌ Vous avez déjà soumis une candidature pour cette offre. Il n'est pas possible de postuler deux fois à la même offre."
        );
      } else {
        setErrorMsg(
          "❌ " + (e?.response?.data?.message || e?.message || "Erreur lors de l'envoi. Essayez à nouveau.")
        );
      }
    } finally {
      setLoadingSubmit(false);
    }
  }

  /* =======================
     SECTIONS LIST
  ======================= */
  const sections = [
    {
      key: "personal",
      title: "Informations personnelles",
      rightAction: null,
      render: () => (
        <div className="space-y-5 sm:space-y-6">
          <InputField
            label="Nom complet"
            placeholder="Ex : Jean Dupont"
            value={form.personal_info.full_name}
            dataCy="full-name"
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, full_name: v },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Email"
              placeholder="jean.dupont@exemple.com"
              value={form.personal_info.email}
              dataCy="email"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: {
                    ...prev.personal_info,
                    email: cleanEmail(v),
                  },
                }))
              }
            />

            <InputField
              label="Téléphone"
              placeholder="+33 6 00 00 00 00"
              value={form.personal_info.phone}
              dataCy="phone"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, phone: v },
                }))
              }
            />
          </div>

          <InputField
            label="Adresse actuelle"
            placeholder="123 Rue de la République, 75001 Paris"
            value={form.personal_info.address}
            dataCy="address"
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, address: v },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Date de naissance"
              placeholder="JJ/MM/AAAA"
              value={form.personal_info.date_naissance}
              dataCy="date-naissance"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, date_naissance: v },
                }))
              }
            />

            <InputField
              label="Lieu de naissance"
              placeholder="Ex : Tunis"
              value={form.personal_info.lieu_naissance}
              dataCy="lieu-naissance"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, lieu_naissance: v },
                }))
              }
            />
          </div>






          <InputField
            label="Poste actuel"
            placeholder="Ex : Développeur Fullstack Senior"
            value={form.personal_info.job_title}
            dataCy="job-title"
            onChange={(v) =>
              setForm((prev) => ({
                ...prev,
                personal_info: { ...prev.personal_info, job_title: v },
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IconInputField
              label="LinkedIn (URL)"
              placeholder="linkedin.com/in/jeandupont"
              value={form.personal_info.linkedin}
              icon="in"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, linkedin: v },
                }))
              }
            />

            <IconInputField
              label="GitHub (URL)"
              placeholder="github.com/jeandupont"
              value={form.personal_info.github}
              icon="<>"
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  personal_info: { ...prev.personal_info, github: v },
                }))
              }
            />
          </div>

          {safeArr(form.personal_info_extra).length > 0 && (
            <div className="space-y-3 pt-2">
              {safeArr(form.personal_info_extra).map((f, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={`Champ (titre)`}
                    placeholder="Ex : Nationalité"
                    value={safeStr(f.label)}
                    onChange={(v) =>
                      setForm((prev) => {
                        const extra = [...safeArr(prev.personal_info_extra)];
                        extra[idx] = { ...extra[idx], label: v };
                        return { ...prev, personal_info_extra: extra };
                      })
                    }
                  />
                  <InputField
                    label="Valeur"
                    placeholder="Ex : Tunisienne"
                    value={safeStr(f.value)}
                    onChange={(v) =>
                      setForm((prev) => {
                        const extra = [...safeArr(prev.personal_info_extra)];
                        extra[idx] = { ...extra[idx], value: v };
                        return { ...prev, personal_info_extra: extra };
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    {
      key: "profile",
      title: "Profil",
      rightAction: null,
      render: () => (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Résumé / Profil</p>
          <textarea
            data-cy="profile"
            className="
              w-full min-h-[160px]
              px-5 py-3 sm:px-6 sm:py-4
              border border-gray-200 dark:border-gray-600 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800
              focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              text-gray-900 dark:text-gray-100
            "
            placeholder="Parlez brièvement de vous..."
            value={form.profile || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, profile: e.target.value }))
            }
          />
        </div>
      ),
    },

    {
      key: "skills",
      title: "Compétences",
      rightAction: null,
      render: () => (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ajouter une compétence
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                data-cy="new-skill"
                className="
                  w-full sm:flex-1
                  px-5 py-3 sm:px-6 sm:py-4
                  border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800
                  focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  text-gray-900 dark:text-gray-100
                "
                placeholder="Ex : React, Node.js, MongoDB..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />

              <button
                type="button"
                data-cy="add-skill-btn"
                onClick={() => {
                  addSkill(newSkill);
                  setNewSkill("");
                }}
                className="
                  w-full sm:w-auto
                  px-6 py-3 sm:px-8 sm:py-4
                  rounded-full bg-green-600 dark:bg-emerald-600 text-white font-semibold
                  hover:bg-green-700 dark:hover:bg-emerald-500 transition
                "
              >
                Ajouter
              </button>
            </div>
          </div>

          {safeArr(form.skills).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {safeArr(form.skills).map((s) => (
                <span
                  key={s}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 rounded-full
                    bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800
                    text-green-800 dark:text-emerald-300
                    text-sm font-semibold
                  "
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-green-700 dark:text-emerald-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune compétence ajoutée.</p>
          )}
        </div>
      ),
    },

    {
      key: "education",
      title: "Formation",
      rightAction: (
        <button
          type="button"
          onClick={addEducation}
          className="
            w-full sm:w-auto
            px-5 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300
            font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          "
        >
          + Ajouter
        </button>
      ),
      render: () => (
        <div className="space-y-6">
          {safeArr(form.education).length > 0 ? (
            safeArr(form.education).map((edu, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4"
              >
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeEducation(i)}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <InputField
                  label="Diplôme"
                  placeholder="Ex : Licence Informatique"
                  value={edu.degree}
                  onChange={(v) => updateEducation(i, "degree", v)}
                />
                <InputField
                  label="Établissement"
                  placeholder="Ex : ISET Sfax"
                  value={edu.institution}
                  onChange={(v) => updateEducation(i, "institution", v)}
                />
                <InputField
                  label="Période"
                  placeholder="Ex : 2022 - 2025"
                  value={edu.period}
                  onChange={(v) => updateEducation(i, "period", v)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune formation ajoutée.</p>
          )}
        </div>
      ),
    },

    {
      key: "experience",
      title: "Expérience professionnelle",
      rightAction: (
        <button
          type="button"
          onClick={addExperience}
          className="
            w-full sm:w-auto
            px-5 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300
            font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          "
        >
          + Ajouter
        </button>
      ),
      render: () => (
        <div className="space-y-6">
          {safeArr(form.experience).length > 0 ? (
            safeArr(form.experience).map((exp, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4"
              >
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeExperience(i)}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <InputField
                  label="Poste"
                  placeholder="Ex : Développeuse Fullstack"
                  value={exp.role}
                  onChange={(v) => updateExperience(i, "role", v)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Entreprise"
                    placeholder="Ex : MTR"
                    value={exp.company}
                    onChange={(v) => updateExperience(i, "company", v)}
                  />
                  <InputField
                    label="Lieu"
                    placeholder="Ex : Sfax"
                    value={exp.location}
                    onChange={(v) => updateExperience(i, "location", v)}
                  />
                </div>

                <InputField
                  label="Période"
                  placeholder="Ex : Juin 2024 - Sept 2024"
                  value={exp.period}
                  onChange={(v) => updateExperience(i, "period", v)}
                />

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Description
                  </p>
                  <textarea
                    className="
                      w-full min-h-[120px]
                      px-5 py-3 sm:px-6 sm:py-4
                      border border-gray-200 dark:border-gray-600 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800
                      focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      text-gray-900 dark:text-gray-100
                    "
                    placeholder="Décrivez vos missions..."
                    value={exp.description || ""}
                    onChange={(e) =>
                      updateExperience(i, "description", e.target.value)
                    }
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune expérience ajoutée.</p>
          )}
        </div>
      ),
    },

    {
      key: "projects",
      title: "Projets",
      rightAction: (
        <button
          type="button"
          onClick={addProject}
          className="
            w-full sm:w-auto
            px-5 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300
            font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          "
        >
          + Ajouter
        </button>
      ),
      render: () => (
        <div className="space-y-6">
          {safeArr(form.projects).length > 0 ? (
            safeArr(form.projects).map((pr, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4"
              >
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeProject(i)}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <InputField
                  label="Nom du projet"
                  placeholder="Ex : YnityLearn"
                  value={pr.name}
                  onChange={(v) => updateProject(i, "name", v)}
                />

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Description
                  </p>
                  <textarea
                    className="
                      w-full min-h-[120px]
                      px-5 py-3 sm:px-6 sm:py-4
                      border border-gray-200 dark:border-gray-600 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800
                      focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
                      placeholder:text-gray-400 dark:placeholder:text-gray-500
                      text-gray-900 dark:text-gray-100
                    "
                    placeholder="Décrivez le projet..."
                    value={pr.description || ""}
                    onChange={(e) =>
                      updateProject(i, "description", e.target.value)
                    }
                  />
                </div>

                <InputField
                  label="Technologies (séparées par virgule)"
                  placeholder="Ex : React, Node.js, MongoDB"
                  value={safeArr(pr.technologies).join(", ")}
                  onChange={(v) =>
                    updateProject(
                      i,
                      "technologies",
                      v
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun projet ajouté.</p>
          )}
        </div>
      ),
    },

    {
      key: "certifications",
      title: "Certifications",
      rightAction: (
        <button
          type="button"
          onClick={addCertification}
          className="
            w-full sm:w-auto
            px-5 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300
            font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          "
        >
          + Ajouter
        </button>
      ),
      render: () => (
        <div className="space-y-6">
          {safeArr(form.certifications).length > 0 ? (
            safeArr(form.certifications).map((c, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4"
              >
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeCertification(i)}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <InputField
                  label="Nom"
                  placeholder="Ex : ISTQB Foundation"
                  value={c.name}
                  onChange={(v) => updateCertification(i, "name", v)}
                />
                <InputField
                  label="Organisme"
                  placeholder="Ex : ISTQB"
                  value={c.org}
                  onChange={(v) => updateCertification(i, "org", v)}
                />
                <InputField
                  label="Date"
                  placeholder="Ex : 2025"
                  value={c.date}
                  onChange={(v) => updateCertification(i, "date", v)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune certification.</p>
          )}
        </div>
      ),
    },

    {
      key: "languages",
      title: "Langues",
      rightAction: (
        <button
          type="button"
          onClick={addLanguage}
          className="
            w-full sm:w-auto
            px-5 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-900 dark:border-gray-300
            font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
          "
        >
          + Ajouter
        </button>
      ),
      render: () => (
        <div className="space-y-6">
          {safeArr(form.languages).length > 0 ? (
            safeArr(form.languages).map((l, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-4"
              >
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeLanguage(i)}
                    className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                  >
                    Supprimer
                  </button>
                </div>

                <InputField
                  label="Langue"
                  placeholder="Ex : Français"
                  value={l.name}
                  onChange={(v) => updateLanguage(i, "name", v)}
                />

                <InputField
                  label="Niveau"
                  placeholder="Ex : Débutant / Intermédiaire / Avancé / Native"
                  value={l.level}
                  onChange={(v) => updateLanguage(i, "level", v)}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune langue ajoutée.</p>
          )}
        </div>
      ),
    },

    {
      key: "interests",
      title: "Centres d’intérêt",
      rightAction: null,
      render: () => (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activités / Intérêts (une ligne = un intérêt)
          </p>

          <textarea
            data-cy="interests"
            className="
              w-full min-h-[160px]
              px-5 py-3 sm:px-6 sm:py-4
              border border-gray-200 dark:border-gray-600 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-800
              focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              text-gray-900 dark:text-gray-100
            "
            placeholder={`Ex :\nSport\nLecture\nHackathons`}
            value={safeArr(form.interests).join("\n")}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                interests: e.target.value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              }))
            }
          />
        </div>
      ),
    },
  ];

  const total = sections.length;
  const current = sectionIndex + 1;
  const percent = Math.round((current / total) * 100);
  const isLast = sectionIndex === sections.length - 1;
  const currentSection = sections[sectionIndex];
  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // animation fluide
    });
  };


  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950 py-8 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs tracking-[0.25em] text-gray-500 dark:text-gray-400 font-semibold">
            SECTION {current} / {total}
          </p>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
            Étape 2 — Vérification & Complément
          </h2>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progression de la candidature</span>
            <span className="font-semibold text-green-700 dark:text-emerald-400">{percent}%</span>
          </div>

          <div className="w-full h-2 bg-green-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 dark:bg-emerald-600 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <Card title={currentSection.title} rightAction={currentSection.rightAction}>
          {currentSection.render()}
        </Card>

        {successMsg && (
          <div className="mt-6 bg-green-50 dark:bg-emerald-950/30 border border-green-200 dark:border-emerald-800 text-green-700 dark:text-emerald-300 p-4 rounded-2xl text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-2xl text-center">
            {errorMsg}
          </div>
        )}

        {!successMsg && (
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (sectionIndex === 0) onBack?.();
                else {
                  setSectionIndex((p) => Math.max(0, p - 1));
                  goToTop();
                }
              }}
              className="
                w-full sm:w-auto
                px-6 sm:px-10 py-3 sm:py-4
                rounded-full border border-gray-900 dark:border-gray-300 bg-white dark:bg-gray-800
                font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition
              "
            >
              ← Retour
            </button>

            {!isLast ? (
              <button
                onClick={() => {
                  setSectionIndex((p) => Math.min(sections.length - 1, p + 1));
                  goToTop();
                }}
                className="
    w-full sm:w-auto
    px-6 sm:px-10 py-3 sm:py-4
    rounded-full bg-green-600 dark:bg-emerald-600 text-white font-semibold
    hover:bg-green-700 dark:hover:bg-emerald-500 transition shadow-lg
  "
              >
                Continuer →
              </button>

            ) : (
              <button
                data-cy="submit-application"
                onClick={handleSubmitFinal}
                disabled={loadingSubmit}
                className="
                  w-full sm:w-auto
                  px-6 sm:px-10 py-3 sm:py-4
                  rounded-full bg-green-600 dark:bg-emerald-600 text-white font-semibold
                  hover:bg-green-700 dark:hover:bg-emerald-500 transition shadow-lg disabled:opacity-50
                "
              >
                {loadingSubmit ? "Envoi..." : "Envoyer ma candidature →"}
              </button>
            )}
          </div>
        )}

        {!successMsg && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Vos modifications sont enregistrées automatiquement.
          </p>
        )}
      </div>
    </div>
  );
}

/* =======================
   SMALL COMPONENTS
======================= */
function Card({ title, rightAction, children, className = "" }) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-2xl sm:rounded-[28px]
        shadow-sm border border-green-100 dark:border-gray-700
        p-4 sm:p-8
        ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <h3 className="font-bold text-xl sm:text-2xl text-gray-900 dark:text-white">{title}</h3>
        {rightAction ? <div className="w-full sm:w-auto">{rightAction}</div> : null}
      </div>

      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, dataCy }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <input
        data-cy={dataCy}
        className="
          w-full
          px-5 py-3 sm:px-6 sm:py-4
          border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800
          focus:ring-2 focus:ring-green-500 dark:focus:ring-emerald-500 focus:border-green-500 dark:focus:border-emerald-500 outline-none transition
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          text-gray-900 dark:text-gray-100
        "
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function IconInputField({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>

      <div
        className="
          flex items-center border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 overflow-hidden
          focus-within:ring-2 focus-within:ring-green-500 dark:focus-within:ring-emerald-500 focus-within:border-green-500 dark:focus-within:border-emerald-500 transition
        "
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400">
          <span className="text-sm font-bold">{icon}</span>
        </div>

        <input
          className="flex-1 px-4 sm:px-5 py-3 sm:py-4 outline-none bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
