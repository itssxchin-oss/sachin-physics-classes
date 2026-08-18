"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
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
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-300 mt-1 text-sm">Choose a new password</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm text-center">
            Password updated successfully. Redirecting to login...
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl btn-glow transition-all disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <p className="text-center text-slate-300 text-sm">
            Redirecting you to login...
          </p>
        )}

        <p className="text-center text-slate-300 mt-6 text-sm">
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