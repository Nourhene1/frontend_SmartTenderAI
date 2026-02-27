"use client";

import { useParams } from "next/navigation";
import ResponsableRescheduleCalendar from "../../../components/responsable/ResponsableRescheduleCalendar";

export default function Page() {
  const { token } = useParams();

  return (
    <div className="min-h-screen bg-[#F6FFF7] dark:bg-[#050B14]">
      {/* ✅ FULL WIDTH (no max-w container) */}
      <div className="w-screen px-2 sm:px-4 lg:px-6 py-6">
        <ResponsableRescheduleCalendar token={token} />
      </div>
    </div>
  );
}