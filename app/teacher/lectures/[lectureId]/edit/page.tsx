"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function EditLecturePage() {
  const { lectureId } = useParams<{ lectureId: string }>();

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [orderNumber, setOrderNumber] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!lectureId) return;

      try {
        // 1. Verify the acting user is the teacher.
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user || user.email !== TEACHER_EMAIL) {
          if (!cancelled) setUnauthorized(true);
          return;
        }

        // 2. Fetch the list of courses for the dropdown.
        const { data: courseList, error: coursesError } = await supabase
          .from("courses")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (!coursesError && courseList) {
          if (!cancelled) setCourses(courseList as { id: string; title: string }[]);
        }

        // 3. Fetch the existing lecture.
        const { data: lecture, error: fetchError } = await supabase
          .from("lectures")
          .select("*")
          .eq("id", lectureId)
          .single();

        if (fetchError || !lecture) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!cancelled) {
          setCourseId(lecture.course_id || "");
          setTitle(lecture.title || "");
          setYoutubeUrl(lecture.youtube_url || "");
          setDescription(lecture.description || "");
          setOrderNumber(lecture.order_number ?? 1);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCoursesLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [lectureId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Verify teacher identity again at submit time.
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: only the teacher account can edit lectures.");
        setSaving(false);
        return;
      }

      if (!courseId) {
        setError("Please select a course.");
        setSaving(false);
        return;
      }

      if (!youtubeUrl.trim()) {
        setError("YouTube URL is required.");
        setSaving(false);
        return;
      }

      // UPDATE the existing row — not an insert.
      const { error: updateError } = await supabase
        .from("lectures")
        .update({
          course_id: courseId,
          title: title.trim(),
          youtube_url: youtubeUrl.trim(),
          description: description.trim(),
          order_number: Number(orderNumber),
        })
        .eq("id", lectureId);

      if (updateError) {
        setError(`Failed to update lecture: ${updateError.message}`);
        setSaving(false);
        return;
      }

      router.push("/teacher/dashboard?updated=lecture");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setSaving(false);
    }
  };

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

        {/* Card Form */}
        <div className="glass p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl fade-up">
          <div className="mb-8">
            <span className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-indigo-500/30 uppercase tracking-wider">
              📹 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Edit Lecture</h1>
            <p className="text-slate-400 text-sm mt-1">
              Update the course, title, video URL, description, and order for this lecture.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading lecture details...</p>
            </div>
          )}

          {!loading && unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Unauthorized: only the teacher account can edit lectures.
            </div>
          )}

          {!loading && notFound && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Lecture not found. It may have been deleted.
            </div>
          )}

          {!loading && error && !notFound && !unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !unauthorized && !notFound && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Course *
                </label>
                {coursesLoading ? (
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                    Loading courses...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                    No courses available.{" "}
                    <Link href="/teacher/courses/new" className="text-blue-400 hover:underline">
                      Create a course first
                    </Link>
                    .
                  </div>
                ) : (
                  <select
                    id="edit-lecture-course-dropdown"
                    required
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">
                      Select a course
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-slate-900">
                        {course.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Lecture Title *
                </label>
                <input
                  id="edit-lecture-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Body Diagrams & Friction Problems"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  YouTube Video URL *
                </label>
                <input
                  id="edit-lecture-youtube-input"
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order Number */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Order Number (Lecture position) *
                </label>
                <input
                  id="edit-lecture-order-input"
                  type="number"
                  min={1}
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Lecture Description
                </label>
                <textarea
                  id="edit-lecture-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts, formula derivations, and problem sets covered..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex items-center justify-end gap-4">
                <Link
                  href="/teacher/dashboard"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-sm transition-all"
                >
                  Cancel
                </Link>
                <button
                  id="update-lecture-btn"
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}
