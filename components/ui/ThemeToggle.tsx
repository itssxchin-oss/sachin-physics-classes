"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/50 dark:border-white/10 bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 transition-all"
        disabled
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-300 dark:border-white/10 bg-slate-200/70 dark:bg-slate-800/60 hover:bg-slate-300 dark:hover:bg-slate-700 text-amber-500 dark:text-amber-400 transition-all duration-200 shadow-sm"
    >
      {isDark ? (
        <Sun className="w-4.5 h-4.5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
