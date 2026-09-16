"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Phone, ArrowLeft, KeyRound, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/database.types";

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Status state
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleRoleRedirect = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    const profile = data as Profile | null;

    if (error || !profile) {
      router.push("/student/dashboard");
      return;
    }

    if (profile.role === "teacher") {
      router.push("/teacher/dashboard");
    } else {
      router.push("/student/dashboard");
    }
  };

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await handleRoleRedirect(authData.user.id);
          return;
        }
      } catch {
        // Not logged in
      } finally {
        setInitialChecking(false);
      }
    }
    checkExistingSession();
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setErrorMsg(error.message);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.refresh();
        await new Promise((resolve) => setTimeout(resolve, 200));
        await handleRoleRedirect(data.user.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getFormattedPhone = () => {
    const cleanNumber = phone.replace(/\D/g, "");
    if (phone.startsWith("+")) return phone;
    return `${countryCode}${cleanNumber}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedPhone = getFormattedPhone();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setSuccessMsg(`OTP code sent to ${formattedPhone}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    const formattedPhone = getFormattedPhone();

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanOtp,
        type: "sms",
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.refresh();
        await new Promise((resolve) => setTimeout(resolve, 200));
        await handleRoleRedirect(data.user.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  if (initialChecking) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center p-4">
        <div className="text-white flex items-center gap-3 font-semibold text-lg">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 fade-up">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">⚛️</span>
            <span className="font-bold text-white text-lg">
              Sachin Physics <span className="gradient-text">Classes</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-300 mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Tab Switcher: Email vs Phone */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              authMethod === "email"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              authMethod === "phone"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Phone OTP</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm text-center">
            {successMsg}
          </div>
        )}

        {authMethod === "email" ? (
          /* Email & Password Form */
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-blue-400 hover:text-blue-300 font-medium text-sm"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl btn-glow transition-all disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In with Email"}
            </button>
          </form>
        ) : (
          /* Phone & OTP Form */
          <div>
            {!otpSent ? (
              /* Step 1: Phone Number Entry */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-400" />
                    <span>Mobile Phone Number</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="+91" className="bg-slate-900 text-white">🇮🇳 +91</option>
                      <option value="+1" className="bg-slate-900 text-white">🇺🇸 +1</option>
                      <option value="+44" className="bg-slate-900 text-white">🇬🇧 +44</option>
                      <option value="+971" className="bg-slate-900 text-white">🇦🇪 +971</option>
                    </select>

                    <input
                      id="login-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    We will send a 6-digit OTP code to verify your phone number.
                  </p>
                </div>

                <button
                  id="send-otp-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl btn-glow transition-all disabled:opacity-50"
                >
                  {loading ? "Sending OTP..." : "Get OTP Code"}
                </button>
              </form>
            ) : (
              /* Step 2: OTP Verification */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Enter 6-Digit OTP</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft className="w-3 h-3" /> Change Number
                    </button>
                  </div>

                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[11px] text-slate-400">
                      Sent to {getFormattedPhone()}
                    </span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl btn-glow transition-all disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP & Sign In"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/20 w-full" />
          <span className="bg-transparent px-3 text-xs text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">
            or continue with
          </span>
          <div className="border-t border-white/20 w-full" />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          id="google-login-btn"
          className="w-full py-3 px-4 bg-white/10 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-3 border border-white/20 hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-slate-300 mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
