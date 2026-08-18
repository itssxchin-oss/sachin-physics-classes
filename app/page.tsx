import Link from "next/link";
import LandingNavbar from "@/components/ui/LandingNavbar";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    title: "Structured Courses",
    description:
      "Physics topics organized chapter-wise for easy learning.",
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <path d="m9.75 15.02 5.75-3.27-5.75-3.27v6.54z" />
      </svg>
    ),
    title: "YouTube Video Lectures",
    description:
      "High-quality recorded lectures accessible anytime.",
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    title: "Progress Tracking",
    description:
      "Track completed lectures and course progress in real-time.",
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    title: "Personal Dashboard",
    description:
      "A dedicated space for every student to manage their learning.",
  },
];

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen hero-bg text-slate-100 relative overflow-hidden">
      <LandingNavbar />

      {/* Animated glassmorphism background elements */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="animate-float absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="animate-float-delayed absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="animate-float absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="animate-float-delayed absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <main className="relative z-10">
        {/* ── HERO SECTION ─────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 pt-40 pb-24 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
              <span className="badge-pulse"></span>
              JEE Main • JEE Advanced • NEET Physics Specialist
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight mb-6 text-balance">
              Sachin Physics{" "}
              <span className="gradient-text">Classes</span>
            </h1>

            <p className="text-xl sm:text-2xl font-semibold text-blue-200/90 mb-4">
              Master Physics with Concept Clarity, Not Cramming
            </p>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
              Structured video lectures, in-depth concept building, and a
              dashboard to track your progress — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link
                href="/signup"
                id="hero-get-started-btn"
                className="w-full sm:w-1/2 py-4 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 btn-glow transition-all text-center"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                id="hero-login-btn"
                className="w-full sm:w-1/2 py-4 px-6 rounded-xl font-bold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-center"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* ── ABOUT US SECTION ─────────────────────────── */}
        <section id="about" className="w-full max-w-4xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="glass rounded-3xl p-8 sm:p-12 text-center card-hover">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
              About <span className="gradient-text">Us</span>
            </h2>
            <p className="text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Sachin Physics Classes is dedicated to helping students build
              strong physics fundamentals through clear, structured video
              lectures and personalized progress tracking. Taught by Sachin,
              every lesson is focused on making physics simple, intuitive, and
              exam-ready — so you spend your time truly understanding concepts
              instead of memorizing formulas.
            </p>
          </div>
        </section>

        {/* ── WHY CHOOSE US / FEATURES SECTION ─────────── */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Why Choose <span className="gradient-text">Us</span>
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto">
              Everything you need to learn physics with confidence — all in one
              place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 card-hover flex flex-col"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600/30 to-cyan-400/30 border border-blue-500/20 flex items-center justify-center text-blue-300 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT SECTION ──────────────────────────── */}
        <section id="contact" className="w-full max-w-4xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="glass rounded-3xl p-8 sm:p-12 text-center card-hover">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-slate-300 mb-8">
              Have questions? Reach out on Instagram — I&apos;m happy to help!
            </p>
            <a
              href="https://instagram.com/sachin.nit_kkr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold btn-glow transition-all"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              @sachin.nit_kkr
            </a>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/40 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-slate-400">
            © {year} Sachin Physics Classes. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built with dedication for physics learners.
          </p>
        </div>
      </footer>
    </div>
  );
}
