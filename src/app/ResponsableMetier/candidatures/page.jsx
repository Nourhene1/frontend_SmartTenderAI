"use client";

import { useEffect, useState } from "react";
import { getMyCandidatures } from "../../services/candidature.api";
import {
  Mail,
  Phone,
  FileText,
  Linkedin,
  UserCircle
} from "lucide-react";

export default function CandidaturesPage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(u);

      try {
        const res = await getMyCandidatures();
        setCandidatures(Array.isArray(res.data) ? res.data : []);
      } catch {
        setCandidatures([]);
      }

      setLoading(false);
    }

    load();
  }, []);

  const extractField = (c, field) => {
    if (c[field]) return c[field];
    if (c.extracted?.[field]) return c.extracted[field];
    if (c.extracted?.parsed?.[field]) return c.extracted.parsed[field];
    if (c.extracted?.personal_info?.[field]) return c.extracted.personal_info[field];
    if (c.extracted?.parsed?.personal_info?.[field]) return c.extracted.parsed.personal_info[field];
    if (c.extracted?.extracted?.[field]) return c.extracted.extracted[field];
    if (c.personalInfoForm?.[field]) return c.personalInfoForm[field];
    return null;
  };

  const getName = (c) => {
    let fullName =
      extractField(c, "nom") ||
      extractField(c, "fullName") ||
      extractField(c, "name");

    if (fullName) return fullName;

    const prenom = extractField(c, "prenom");
    const nom = extractField(c, "lastName");

    if (prenom && nom) return `${prenom} ${nom}`;
    return prenom || nom || "—";
  };

  const getEmail = (c) => extractField(c, "email") || "—";

  const getPhone = (c) =>
    extractField(c, "telephone") ||
    extractField(c, "phone") ||
    "—";

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const withApiPrefix = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
  };

  const getCvLink = (c) => {
    if (c.cv?.fileUrl) return withApiPrefix(c.cv.fileUrl);
    if (c.cv?.filename) return `${API_URL}/uploads/cvs/${c.cv.filename}`;
    if (c.cv?.path) return withApiPrefix(c.cv.path);
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-gray-950 p-4 sm:p-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

        {/* HEADER */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Mes candidatures
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Rôle: {user?.role || "—"}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {candidatures.length} candidature(s)
          </p>
        </div>

        {/* EMPTY */}
        {candidatures.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center">
            <FileText className="mx-auto w-10 h-10 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Aucune candidature trouvée
            </p>
          </div>
        )}

        {/* LIST */}
        <div className="space-y-8">
          {candidatures.map((c) => {
            const name = getName(c);
            const email = getEmail(c);
            const phone = getPhone(c);
            const cvLink = getCvLink(c);
            const jobTitle = c.jobTitle || "Poste non défini";

            return (
              <div
                key={c._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700
                           p-5 sm:p-8 hover:shadow-md transition"
              >

                {/* TOP */}
                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3 sm:gap-4">
                    <UserCircle className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                        {name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs font-semibold
                             bg-green-100 dark:bg-emerald-950/40 text-green-800 dark:text-emerald-300
                             px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    {jobTitle}
                  </p>

                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4 sm:my-6" />

                {/* CONTACT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-green-100 dark:bg-emerald-900/30 p-2.5 sm:p-3 rounded-full flex-shrink-0">
                      <Mail size={18} className="text-green-700 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">EMAIL</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-green-100 dark:bg-emerald-900/30 p-2.5 sm:p-3 rounded-full flex-shrink-0">
                      <Phone size={18} className="text-green-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">TÉLÉPHONE</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{phone}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4 sm:my-6" />

                {/* FOOTER */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex gap-3">
                    {cvLink && (
                      <a
                        href={cvLink}
                        target="_blank"
                        className="px-5 py-2 rounded-full border-2 border-green-600 dark:border-emerald-600
                                   text-green-700 dark:text-emerald-400 text-sm font-semibold
                                   hover:bg-green-600 dark:hover:bg-emerald-600 hover:text-white transition
                                   flex items-center gap-2"
                      >
                        <FileText size={16} />
                        Voir CV
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}