"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user || null;

        if (user) {
          setIsLoggedIn(true);
          setUserEmail(user.email ?? null);
        } else {
          setIsLoggedIn(false);
          setUserEmail(null);
        }
      } catch {
        setIsLoggedIn(false);
        setUserEmail(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { email?: string | null } } | null) => {
        if (session?.user) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email ?? null);
        } else {
          setIsLoggedIn(false);
          setUserEmail(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserEmail(null);
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  const isTeacher = userEmail === TEACHER_EMAIL;

  // The landing page has its own LandingNavbar — don't render this one there.
  if (pathname === "/") {
    return null;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2 group flex-shrink-0">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-base sm:text-lg group-hover:scale-105 transition-transform">
            ⚛️
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
            Sachin Physics <span className="gradient-text">Classes</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
          {!loading && isLoggedIn ? (
            <>
              <Link
                href="/batches"
                className={`transition-colors ${
                  pathname === "/batches"
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Batches
              </Link>

              <Link
                href="/student/dashboard"
                className={`transition-colors whitespace-nowrap ${
                  pathname === "/student/dashboard"
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                }`}
              >
                Student Dashboard
              </Link>

              {/* Teacher Dashboard link — only shown for the teacher email */}
              {isTeacher && (
                <Link
                  href="/teacher/dashboard"
                  className={`transition-colors whitespace-nowrap ${
                    pathname === "/teacher/dashboard"
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  Teacher Dashboard
                </Link>
              )}

              <ThemeToggle />

              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="px-3 lg:px-4 py-1.5 rounded-lg bg-red-500/10 dark:bg-red-500/20 hover:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/30 font-semibold text-xs transition-all whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            /* Unauthenticated Public Navigation */
            <>
              <Link
                href="/batches"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                Batches
              </Link>
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs btn-glow transition-all"
              >
                Sign Up
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>

        {/* Mobile Right Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 space-y-1 animate-in slide-in-from-top duration-200">
          {!loading && isLoggedIn ? (
            <>
              <Link
                href="/batches"
                onClick={closeMenu}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/batches"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                📦 Batches
              </Link>
              <Link
                href="/student/dashboard"
                onClick={closeMenu}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/student/dashboard"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                🏠 Student Dashboard
              </Link>
              {isTeacher && (
                <Link
                  href="/teacher/dashboard"
                  onClick={closeMenu}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === "/teacher/dashboard"
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  🧑‍🏫 Teacher Dashboard
                </Link>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 text-left transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/batches"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                📦 Batches
              </Link>
              <Link
                href="/login"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                🔑 Login
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm text-center btn-glow transition-all mt-2"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
