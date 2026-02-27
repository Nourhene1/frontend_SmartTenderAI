"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ✅ Corrigé : .slice(1).join("=") pour ne pas couper les JWT contenant "="
function getCookie(name) {
  const row = document.cookie.split("; ").find((c) => c.startsWith(name + "="));
  if (!row) return null;
  const val = row.split("=").slice(1).join("=");
  if (!val || val === "null" || val === "undefined" || val.trim() === "") return null;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export default function Layout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const token = getCookie("token") || localStorage.getItem("token");
      const role = (
        getCookie("role") ||
        localStorage.getItem("role") ||
        ""
      ).toUpperCase();

      if (!token) return router.replace("/login");
      if (role === "ADMIN") return router.replace("/unauthorized");

      setReady(true);
    }, 80);

    return () => clearTimeout(t);
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
