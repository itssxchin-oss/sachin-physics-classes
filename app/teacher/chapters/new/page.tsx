"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function NewChapterPage() {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderNumber, setOrderNumber] = useState<number>(1);

  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    course?: string;
    title?: string;
    orderNumber?: string;
    submit?: string;
  }>({});

  const router = useRouter();
  const supabase = createClient();

  // ── Load courses for the dropdown ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchCourses() {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (!error && data && !cancelled) {
          setCourses(data as { id: string; title: string }[]);
          if (data.length > 0) setSelectedCourseId(data[0].id);
        }
      } catch {
        // silently ignore — UI shows "no courses" fallback
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    fetchCourses();
    return () => { cancelled = true; };
  }, [supabase]);

  // ── Validation ───────────────────────────────────────────────
  function validate(): boolean {
    const next: typeof errors = {};

    if (!selectedCourseId) next.course = "Please select a course.";
    if (!title.trim())      next.title = "Chapter title is required.";
    if (!orderNumber || orderNumber < 1)
      next.orderNumber = "Order number must be at least 1.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      // Verify teacher identity before writing.
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setErrors({ submit: "Unauthorized: only the teacher account can add chapters." });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("chapters").insert({
        course_id:    selectedCourseId,
        title:        title.trim(),
        description:  description.trim(),
        order_number: Number(orderNumber),
      });

      if (insertError) {
        // Surface duplicate order_number clearly
        if (insertError.message.includes("unique") || insertError.code === "23505") {
          setErrors({
            submit: `A chapter with order number ${orderNumber} already exists in this course. Choose a different number.`,
          });
        } else {
          setErrors({ submit: `Failed to create chapter: ${insertError.message}` });
        }
        setLoading(false);
        return;
      }

      setMessage("Chapter created successfully! Redirecting…");
      setTimeout(() => {
        router.push("/teacher/dashboard?success=chapter-created");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrors({
        submit: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
      setLoading(false);
    }
  };

  // ── UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-24 w-full">
        {/* Back navigation */}
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          ← Back to Teacher Dashboard
        </Link>

        {/* Form card */}
        <div className="glass p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl fade-up">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-emerald-500/30 uppercase tracking-wider">
              📂 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Add New Chapter</h1>
            <p className="text-slate-400 text-sm mt-1">
              Group related lectures into a chapter inside an existing course.
            </p>
          </div>

          {/* Success banner */}
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm text-center font-medium">
              {message}
            </div>
          )}

          {/* Global error */}
          {errors.submit && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* ── Course dropdown ── */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Course <span className="text-red-400">*</span>
              </label>

              {coursesLoading ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                  Loading courses…
                </div>
              ) : courses.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  No courses found.{" "}
                  <Link href="/teacher/courses/new" className="text-blue-400 hover:underline">
                    Create a course first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="chapter-course-dropdown"
                  required
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    if (errors.course) setErrors((p) => ({ ...p, course: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all ${
                    errors.course ? "border-red-500/60" : "border-white/20 hover:border-white/30"
                  }`}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.title}
                    </option>
                  ))}
                </select>
              )}

              {errors.course && (
                <p className="mt-1.5 text-xs text-red-400">{errors.course}</p>
              )}
            </div>

            {/* ── Title ── */}
            <div>
              <label
                htmlFor="chapter-title"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Chapter Title <span className="text-red-400">*</span>
              </label>
              <input
                id="chapter-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="e.g. Mechanics, Thermodynamics, Optics…"
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.title
                    ? "border-red-500/60"
                    : "border-white/15 hover:border-white/25"
                }`}
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            {/* ── Order number ── */}
            <div>
              <label
                htmlFor="chapter-order"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Order Number <span className="text-red-400">*</span>
              </label>
              <input
                id="chapter-order"
                type="number"
                min={1}
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(Number(e.target.value));
                  if (errors.orderNumber)
                    setErrors((p) => ({ ...p, orderNumber: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.orderNumber
                    ? "border-red-500/60"
                    : "border-white/15 hover:border-white/25"
                }`}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Controls the display order of this chapter within the course.
                Must be unique per course.
              </p>
              {errors.orderNumber && (
                <p className="mt-1 text-xs text-red-400">{errors.orderNumber}</p>
              )}
            </div>

            {/* ── Description (optional) ── */}
            <div>
              <label
                htmlFor="chapter-description"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Description{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="chapter-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of what this chapter covers…"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 hover:border-white/25 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>

            {/* ── Actions ── */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <Link
                href="/teacher/dashboard"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-sm transition-all"
              >
                Cancel
              </Link>

              <button
                id="create-chapter-submit"
                type="submit"
                disabled={loading || coursesLoading || courses.length === 0}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Creating…
                  </>
                ) : (
                  "＋ Create Chapter"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}
