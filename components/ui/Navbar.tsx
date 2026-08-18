"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
      (_event, session) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserEmail(null);
    router.push("/login");
    router.refresh();
  };

  const isTeacher = userEmail === TEACHER_EMAIL;

  // The landing page has its own LandingNavbar — don't render this one there.
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
            ⚛️
          </span>
          <span className="font-extrabold text-white text-base tracking-tight">
            Sachin Physics <span className="gradient-text">Classes</span>
          </span>
        </Link>

        {/* Dynamic Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          {!loading && isLoggedIn ? (
            <>
              <Link
                href="/courses"
                className={`transition-colors ${
                  pathname === "/courses"
                    ? "text-blue-400 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Courses
              </Link>

              <Link
                href="/student/dashboard"
                className={`transition-colors ${
                  pathname === "/student/dashboard"
                    ? "text-blue-400 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Student Dashboard
              </Link>

              {/* Teacher Dashboard link — only shown for the teacher email */}
              {isTeacher && (
                <Link
                  href="/teacher/dashboard"
                  className={`transition-colors ${
                    pathname === "/teacher/dashboard"
                      ? "text-indigo-400 font-bold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Teacher Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-xs transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            /* Unauthenticated Public Navigation */
            <>
              <Link
                href="/courses"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs btn-glow transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
