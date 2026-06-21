"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Sun, Moon, Leaf, LogOut, Settings, ChevronDown, Globe } from "lucide-react";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";
import MobileNav from "./MobileNav";
import NotificationsDropdown from "./NotificationsDropdown";
import OnboardingGuide from "./OnboardingGuide";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useI18n } from "@/lib/i18n";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = () => {
      api.get("/tenants/me").catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        } else if (err.response?.status === 403) {
          const detail = err.response?.data?.detail;
          if (detail === "licence_expired" || detail?.includes("désactivé")) {
            window.location.href = "/activate";
          }
        }
      });
    };
    checkSession();
    const interval = setInterval(checkSession, 60000);
    window.addEventListener("focus", checkSession);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSession);
    };
  }, [pathname]);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      const main = document.querySelector("main");
      if (main) {
        const handleScroll = () => setSidebarOpen(false);
        main.addEventListener("scroll", handleScroll, { once: true });
        return () => main.removeEventListener("scroll", handleScroll);
      }
    }
  }, [sidebarOpen]);

  return (
    <AuthGuard>
      <OnboardingGuide />
      <div className="flex h-screen overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="relative z-10 h-full" onClick={(e) => e.stopPropagation()}>
              <Sidebar />
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-[-48px] rounded-full bg-gray-800 p-2 text-white shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-[10px] font-bold text-white">
                  BR
                </div>
                <span className="text-sm font-semibold dark:text-white">Naatal ERP Cloud</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title={theme === "light" ? "Mode sombre" : theme === "dark" ? "Mode Solarized" : "Mode clair"}
              >
                {theme === "light" && <Moon className="h-4 w-4" />}
                {theme === "dark" && <Leaf className="h-4 w-4" />}
                {theme === "solarized" && <Sun className="h-4 w-4" />}
              </button>

              <button
                onClick={() => {
                  const langs: ("fr" | "wo" | "en")[] = ["fr", "wo", "en"];
                  const next = langs[(langs.indexOf(lang) + 1) % langs.length];
                  setLang(next);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title={lang === "fr" ? "Wolof" : lang === "wo" ? "English" : "Français"}
              >
                <Globe className="h-4 w-4" />
                {lang === "fr" ? "WO" : lang === "wo" ? "EN" : "FR"}
              </button>

              <NotificationsDropdown />

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-700">
                      <p className="text-xs text-gray-500">{t("connected")}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.phone}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      {t("settings")}
                    </Link>
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 pb-20 lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>

        <MobileNav />
      </div>
    </AuthGuard>
  );
}
