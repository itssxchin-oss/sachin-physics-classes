"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Contact Us", href: "/#contact" },
];

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
            ⚛️
          </span>
          <span className="font-extrabold text-white text-base tracking-tight">
            Sachin Physics <span className="gradient-text">Classes</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
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
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-md px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={closeMenu}
            className="block px-4 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            onClick={closeMenu}
            className="block px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm text-center btn-glow transition-all"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}
