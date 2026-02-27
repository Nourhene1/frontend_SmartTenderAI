"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecruiterInterviewRedirect() {
  const { interviewId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!interviewId) return;
    router.replace(`/interviews/${interviewId}/reschedule`);
  }, [interviewId, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-gray-500">
      Redirection...
    </div>
  );
}