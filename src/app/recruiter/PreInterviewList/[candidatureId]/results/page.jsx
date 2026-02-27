// app/recruiter/PreInterviewList/[candidatureId]/results/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../../services/api";
import Link from "next/link";
import {
  Brain,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  Briefcase,
  Mail,
  Download,
} from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function safeStr(v) {
  return v ? String(v).trim() : "";
}

// ── Cercle de score ──────────────────────────────────────────────────────────────
function ScoreCircle({ percentage }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 80 ? "#16A34A" : percentage >= 65 ? "#22C55E" : percentage >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb dark:stroke-slate-700" strokeWidth="12" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-xs font-medium mt-1" style={{ color }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

