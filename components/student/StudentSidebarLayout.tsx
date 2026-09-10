"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

interface StudentSidebarLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  backHref?: string;
}

const NAV_ITEMS = [
  {
    label: "Study",
    href: "/student/dashboard",
    icon: LayoutDashboard,
    activeColor: "text-blue-400",
    activeBg: "bg-blue-500/15 border-blue-500/30",
    emoji: "🏠",
  },
  {
    label: "Batches",
    href: "/batches",
    icon: BookOpen,
    activeColor: "text-purple-400",
    activeBg: "bg-purple-500/15 border-purple-500/30",
    emoji: "📦",
  },
  {
    label: "My Batches",
    href: "/student/my-batches",
    icon: GraduationCap,
    activeColor: "text-cyan-400",
    activeBg: "bg-cyan-500/15 border-cyan-500/30",
    emoji: "🎓",
  },
];

export default function StudentSidebarLayout({
  children,
  pageTitle,
  backHref,
}: StudentSidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          setUserEmail(user.email ?? null);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          setUserName(profile?.full_name || user.email?.split("@")[0] || "Student");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "S";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setSidebarOpen(false)}>
          <span className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
            ⚛️
          </span>
          <span className="font-extrabold text-white text-sm tracking-tight leading-tight">
            Sachin Physics<br />
            <span className="gradient-text">Classes</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/batches"
              ? pathname === "/batches" || (pathname.startsWith("/batches/") && !pathname.startsWith("/student"))
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? `${item.activeBg} ${item.activeColor} border-current/30 shadow-sm`
                  : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
              }`}
            >
              <span className="text-base w-5 text-center">{item.emoji}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {!loading && userEmail && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-x-hidden relative">
      {/* Desktop Sidebar (Fixed Width w-64) */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-40 bg-slate-950/95 border-r border-white/10 backdrop-blur-md">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slide-out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content Outer Container */}
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0 lg:pl-64">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/90 backdrop-blur-md border-b border-white/10 flex items-center px-4 sm:px-6 lg:px-8 gap-3 w-full">
          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Back button */}
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          )}

          {/* Dynamic Page Title */}
          {pageTitle && (
            <h1 className="text-sm sm:text-base font-bold text-white truncate flex-1">{pageTitle}</h1>
          )}

          {/* User Profile Avatar */}
          <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
            {!loading && (
              <>
                <span className="hidden sm:block text-xs font-semibold text-slate-300 truncate max-w-[140px]">
                  {userName}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border border-white/20 shadow-md">
                  {initials}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Inner Main Page View */}
        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
