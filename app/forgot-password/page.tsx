"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">⚛️</span>
            <span className="font-bold text-white text-lg">
              Sachin Physics <span className="gradient-text">Classes</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-300 mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {sent && (
          <div className="mb-5 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm text-center">
            Password reset link sent! Check your email.
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl btn-glow transition-all disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <p className="text-center text-slate-300 text-sm">
            If the email exists, a reset link is on its way.
          </p>
        )}

        <p className="text-center text-slate-300 mt-6 text-sm">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}