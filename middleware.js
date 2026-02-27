import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const rawToken = req.cookies.get("token")?.value ?? "";
  const decodedToken = rawToken ? decodeURIComponent(rawToken) : "";
  const token =
    decodedToken &&
    decodedToken !== "null" &&
    decodedToken !== "undefined" &&
    decodedToken.trim() !== ""
      ? decodedToken
      : null;

  const role = (req.cookies.get("role")?.value || "").trim().toUpperCase();
  const isAdmin = role === "ADMIN";

  const isRecruiterPath = pathname.startsWith("/recruiter");
  const isResponsablePath =
    pathname.startsWith("/ResponsableMetier") ||
    pathname.startsWith("/responsableMetier");

  const isLoginPage = pathname.startsWith("/login");
  const isUnauthorized = pathname.startsWith("/unauthorized");
  const isProtected = isRecruiterPath || isResponsablePath;

  const redirect = (to) => {
    const url = req.nextUrl.clone();
    url.pathname = to;
    const res = NextResponse.redirect(url);
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  };

  // 1) Protected + pas connecté => login
  if (isProtected && !token) return redirect("/login");

  // 2) Routing par rôle
  if (isRecruiterPath && token && !isAdmin) return redirect("/unauthorized");
  if (isResponsablePath && token && isAdmin) return redirect("/unauthorized");

  // 3) Connecté et va /login
  if (isLoginPage && token)
    return redirect(
      isAdmin ? "/recruiter/dashboard" : "/ResponsableMetier/candidatures",
    );

  // 4) No cache pages sensibles
  if (isProtected || isLoginPage || isUnauthorized) {
    const res = NextResponse.next();
    res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("x-middleware-cache", "no-cache");

    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
