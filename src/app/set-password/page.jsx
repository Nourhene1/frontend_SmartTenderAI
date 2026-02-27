import { Suspense } from "react";
import SetPasswordClient from "./SetPasswordClient";

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0FAF0] dark:bg-gray-950 transition-colors duration-300 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#6CB33F]" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">Chargement...</p>
          </div>
        </div>
      }
    >
      <SetPasswordClient />
    </Suspense>
  );
}