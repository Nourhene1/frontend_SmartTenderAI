"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { logout } from "../services/auth.api";
import { Moon, Sun, Bell, Check, Briefcase, FileText, X, Clock, AlertTriangle } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import api from "../services/api";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/Notification.api";

function NotificationIcon({ type }) {
  const base = "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0";
  switch (type) {
    case "NEW_JOB_PENDING":
      return <span className={`${base} bg-amber-100 dark:bg-amber-900/40`}><Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" /></span>;
    case "NEW_CANDIDATURE":
      return <span className={`${base} bg-blue-100 dark:bg-blue-900/40`}><FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /></span>;
    case "JOB_CONFIRMED":
      return <span className={`${base} bg-green-100 dark:bg-green-900/40`}><Check className="w-4 h-4 text-green-600 dark:text-green-400" /></span>;
    case "JOB_REJECTED":
      return <span className={`${base} bg-red-100 dark:bg-red-900/40`}><X className="w-4 h-4 text-red-600 dark:text-red-400" /></span>;
   
    default:
      return <span className={`${base} bg-gray-100 dark:bg-gray-700`}><Bell className="w-4 h-4 text-gray-500" /></span>;
  }
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotifDropdownMobile({ notifications, loadingNotif, unreadCount, onNotifClick, onMarkAllRead }) {
  return (
    <div className="fixed left-4 right-4 top-[68px] max-h-[70vh] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-[9999]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-[#6CB33F] font-semibold">Tout lire</button>
        )}
      </div>
      <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50" style={{ maxHeight: "calc(70vh - 52px)" }}>
        {loadingNotif ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">Aucune notification</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <button key={notif._id} onClick={() => onNotifClick(notif)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.read ? "bg-[#6CB33F]/5" : ""}`}
            >
              <NotificationIcon type={notif.type} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug break-words ${!notif.read ? "text-gray-900 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400"}`}>
                  {notif.message}
                </p>
                <p className={`text-xs mt-1 ${!notif.read ? "text-[#6CB33F] font-semibold" : "text-gray-400"}`}>
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              {!notif.read && <span className="w-3 h-3 rounded-full bg-[#6CB33F] flex-shrink-0 mt-1" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function NotifDropdownDesktop({ notifications, loadingNotif, unreadCount, onNotifClick, onMarkAllRead }) {
  const [activeTab, setActiveTab] = useState("all");
  const displayed = activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="rounded-2xl shadow-2xl overflow-hidden z-[9999] bg-white dark:bg-[#242526] border border-gray-200 dark:border-gray-700"
      style={{ width: "540px", minWidth: "540px" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-sm text-[#6CB33F] hover:text-[#4E8F2F] font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-[#6CB33F]/10">
              Tout marquer lu
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeTab === "all" ? "bg-[#6CB33F]/15 dark:bg-[#6CB33F]/20 text-[#4E8F2F] dark:text-[#6CB33F]" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
            Tout
          </button>
          <button onClick={() => setActiveTab("unread")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === "unread" ? "bg-[#6CB33F]/15 dark:bg-[#6CB33F]/20 text-[#4E8F2F] dark:text-[#6CB33F]" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
            Non lu
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>
      {notifications.length > 0 && (
        <div className="px-5 pb-1">
          <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400">Plus tôt</p>
        </div>
      )}
      <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
        {loadingNotif ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-7 h-7 border-2 border-[#6CB33F] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Chargement…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Bell className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Aucune notification</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center">Vous êtes à jour !</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Tout est lu !</p>
          </div>
        ) : (
          <div className="pb-2">
            {displayed.map((notif) => (
              <button key={notif._id} onClick={() => onNotifClick(notif)}
                className={`w-full flex items-center gap-3 px-3 py-2 mx-2 rounded-xl text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${!notif.read ? "bg-[#6CB33F]/8 dark:bg-[#6CB33F]/10" : ""}`}
                style={{ width: "calc(100% - 16px)" }}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${!notif.read ? "bg-[#6CB33F]/15 dark:bg-[#6CB33F]/20" : "bg-gray-100 dark:bg-gray-700"}`}>
                    <NotificationIcon type={notif.type} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <p className={`text-[14px] leading-snug break-words ${!notif.read ? "text-gray-900 dark:text-white font-semibold" : "text-gray-700 dark:text-gray-300 font-normal"}`}>
                    {notif.message}
                  </p>
                  <p className={`text-[13px] mt-1 font-semibold ${!notif.read ? "text-[#6CB33F]" : "text-gray-400 dark:text-gray-500"}`}>
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && <span className="w-3 h-3 rounded-full bg-[#6CB33F] flex-shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [openMobile, setOpenMobile] = useState(false);
  const [openCandidatures, setOpenCandidatures] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openFormulaires, setOpenFormulaires] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openNotif, setOpenNotif] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      else setUser(null);
    };
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("user-updated", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-updated", loadUser);
    };
  }, []);

  useEffect(() => {
    setOpenMobile(false);
    setOpenCandidatures(false);
    setOpenAdmin(false);
    setOpenFormulaires(false);
    setOpenNotif(false);
  }, [pathname]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch { }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpenNotif = async () => {
    const willOpen = !openNotif;
    setOpenNotif(willOpen);
    setOpenCandidatures(false);
    setOpenAdmin(false);
    setOpenFormulaires(false);
    if (willOpen) {
      setLoadingNotif(true);
      try {
        const res = await getNotifications();
        setNotifications(res.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotif(false);
      }
    }
  };

  const handleNotifClick = async (notif) => {
    setOpenNotif(false);
    if (!notif.read) {
      try {
        await markAsRead(notif._id);
        setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch { }
    }
    if (notif.link) router.push(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inBell = notifRef.current && notifRef.current.contains(e.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      const inMobileDropdown = mobileDropdownRef.current && mobileDropdownRef.current.contains(e.target);
      if (!inBell && !inDropdown && !inMobileDropdown) setOpenNotif(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path) => pathname === path;
  const isAdmin = user?.role === "ADMIN";
  const isCandidate = user?.role === "CANDIDATE";                   // ✅ NOUVEAU

  const isInCandidatures =
    pathname.startsWith("/recruiter/candidatures") ||
    pathname.startsWith("/recruiter/CandidatureAnalysis");

  // ✅ FIX: variable manquante → causait "isInAdmin is not defined"

  async function handleLogout() {
    try { await logout(); } catch { }
    finally {
      document.cookie = "token=; Path=/; Max-Age=0; SameSite=Lax";
      document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      router.replace("/login");
      router.refresh();
    }
  }

  const linkBase = "px-3 py-2 rounded-full font-semibold transition text-sm whitespace-nowrap";
  const activeLink = "bg-[#6CB33F] text-white shadow";
  const inactiveLink = "text-gray-600 dark:text-gray-300 hover:text-[#4E8F2F] dark:hover:text-[#86efac]";
  const dropdownBase = "absolute left-0 mt-2 w-64 rounded-xl shadow-lg border transition-colors";
  const dropdownLight = "bg-white border-gray-200";
  const dropdownDark = "dark:bg-gray-800 dark:border-gray-700";
  const dropdownItemBase = "block px-4 py-3 transition";
  const dropdownActive = "bg-[#6CB33F]/10 text-[#4E8F2F] font-semibold";
  const dropdownHover = "hover:bg-gray-50 dark:hover:bg-gray-700";

  const BellButton = ({ isMobile }) => (
    <button onClick={handleOpenNotif}
      className={`relative p-2.5 rounded-full transition-colors ${isMobile ? "hover:bg-gray-100/70 dark:hover:bg-gray-700/50" : "hover:bg-gray-200/70 dark:hover:bg-gray-700/50"}`}
      aria-label="Notifications"
    >
      <span className="relative inline-flex">
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/85 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">

            {/* LOGO */}
            <Link href="/" className="flex items-center">
              <Image src="/images/optylab_logo.png" alt="Optylab" width={180} height={60} priority className="h-auto w-[140px] sm:w-[180px] dark:hidden" />
              <Image src="/images/logo_dark.png" alt="Optylab" width={180} height={60} priority className="h-auto w-[140px] sm:w-[180px] hidden dark:block" />
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center bg-[#F4F7F5] dark:bg-gray-800/60 rounded-full p-1 gap-1 transition-colors duration-200">
              {!isAdmin && !isCandidate && (
                <Link href="/jobs" className={`${linkBase} ${isActive("/jobs") ? activeLink : inactiveLink}`}>
                  Offres d&apos;emploi
                </Link>
              )}

              {/* ✅ MENU CANDIDAT */}
              {isCandidate && (
                <>
                  <Link href="/jobs" className={`${linkBase} ${isActive("/jobs") ? activeLink : inactiveLink}`}>
                    Offres d&apos;emploi
                  </Link>
                  <Link href="/candidat/my-applications" className={`${linkBase} ${isActive("/candidat/my-applications") ? activeLink : inactiveLink}`}>
                    Mes candidatures
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link href="/recruiter/dashboard" className={`${linkBase} ${isActive("/recruiter/dashboard") ? activeLink : inactiveLink}`}>
                    Tableau de bord
                  </Link>
                  <Link href="/recruiter/tenders" className={`${linkBase} ${isActive("/recruiter/tenders") ? activeLink : inactiveLink}`}>
                    Gestion offres
                  </Link>

                  {/* CANDIDATURES DROPDOWN */}
                  <div className="relative">
                    <button
                      onClick={() => { setOpenCandidatures((v) => !v); setOpenAdmin(false); setOpenFormulaires(false); setOpenNotif(false); }}
                      className={`${linkBase} ${isInCandidatures ? activeLink : inactiveLink}`}
                    >
                      Candidatures ▾
                    </button>
                    {openCandidatures && (
                      <div className={`${dropdownBase} ${dropdownLight} ${dropdownDark}`}>
                        <Link href="/recruiter/candidatures" className={`${dropdownItemBase} ${isActive("/recruiter/candidatures") ? dropdownActive : dropdownHover}`}>
                          Liste des candidatures
                        </Link>
                        <Link href="/recruiter/CandidatureAnalysis" className={`${dropdownItemBase} ${isActive("/recruiter/CandidatureAnalysis") ? dropdownActive : dropdownHover}`}>
                          Analyse des candidatures
                        </Link>
                        <Link href="/recruiter/PreInterviewList" className={`${dropdownItemBase} ${isActive("/recruiter/PreInterviewList") ? dropdownActive : dropdownHover}`}>
                          Liste des pré-sélections
                        </Link>
                      </div>
                    )}
                  </div>

                
                </>
              )}
            </div>

            {/* RIGHT SIDE (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={toggleTheme}
                className="p-2.5 rounded-full hover:bg-gray-200/70 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Changer de thème"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
              </button>

              {user && (
                <div ref={notifRef}>
                  <BellButton isMobile={false} />
                </div>
              )}

              {!user ? (
                <Link href="/login" className="font-semibold text-[#6CB33F] hover:underline">
                  Connexion
                </Link>
              ) : (
                <button onClick={handleLogout} className="font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors">
                  Déconnexion
                </button>
              )}
            </div>

            {/* MOBILE RIGHT */}
            <div className="md:hidden flex items-center gap-2">
              {user && (
                <div ref={notifRef}>
                  <BellButton isMobile={true} />
                </div>
              )}
              <button
                onClick={() => setOpenMobile((v) => !v)}
                className="p-2 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}
          {openMobile && (
            <div className="md:hidden pb-5 pt-2">
              <div className="rounded-2xl bg-white/95 dark:bg-gray-900/85 shadow-xl border border-gray-200/70 dark:border-gray-700/60 p-4 space-y-2 backdrop-blur-sm transition-colors duration-200">
                {!isAdmin && !isCandidate && (
                  <Link href="/tenders" className={`block px-5 py-3.5 rounded-xl font-medium transition ${isActive("/tenders") ? "bg-[#6CB33F] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60"}`}>
                    Offres d&apos;emploi
                  </Link>
                )}

                {/* ✅ MOBILE MENU CANDIDAT */}
                {isCandidate && (
                  <>
                    <Link href="/tenders" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                      Offres d&apos;emploi
                    </Link>
                    <Link href="/candidate/my-applications" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                      Mes candidatures
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link href="/recruiter/dashboard" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">Tableau de bord</Link>
                    <Link href="/recruiter/tenders" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">Gestion offres</Link>
                    <Link href="/recruiter/candidatures" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">Liste des candidatures</Link>
                    <Link href="/recruiter/CandidatureAnalysis" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">Analyse des candidatures</Link>
                    <Link href="/recruiter/PreInterviewList" className="block px-5 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">Liste des pré-sélections</Link>
                  
                  </>
                )}

                <div className="pt-3 mt-2 border-t border-gray-200/70 dark:border-gray-700/60">
                  <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-colors">
                    {theme === "dark" ? <><Sun className="h-5 w-5 text-amber-400" /><span>Mode clair</span></> : <><Moon className="h-5 w-5 text-gray-700" /><span>Mode sombre</span></>}
                  </button>
                  {!user ? (
                    <Link href="/login" className="block px-5 py-3.5 rounded-xl font-semibold text-[#6CB33F] hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                      Connexion
                    </Link>
                  ) : (
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
                      Déconnexion
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* NOTIFICATION DROPDOWN MOBILE */}
      {openNotif && user && (
        <div ref={mobileDropdownRef} className="md:hidden">
          <NotifDropdownMobile
            notifications={notifications}
            loadingNotif={loadingNotif}
            unreadCount={unreadCount}
            onNotifClick={handleNotifClick}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      )}

      {/* NOTIFICATION DROPDOWN DESKTOP */}
      {openNotif && user && (
        <div ref={dropdownRef} className="hidden md:block fixed z-[9999]" style={{ top: "68px", right: "24px" }}>
          <NotifDropdownDesktop
            notifications={notifications}
            loadingNotif={loadingNotif}
            unreadCount={unreadCount}
            onNotifClick={handleNotifClick}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      )}
    </>
  );
}