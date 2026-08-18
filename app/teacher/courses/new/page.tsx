"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // 1. Get logged in teacher user and verify email
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: only the teacher account can create courses.");
        setLoading(false);
        return;
      }

      const teacherId = user.id;

      // 2. Insert into courses table
      const { error: insertError } = await supabase
        .from("courses")
        .insert({
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailUrl.trim() || "/images/physics_course.png",
          teacher_id: teacherId,
          is_published: true,
        });

      if (insertError) {
        setError(`Failed to create course: ${insertError.message}`);
      } else {
        setMessage("Course created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/teacher/dashboard");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
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
            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-blue-500/30 uppercase tracking-wider">
              🎓 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Create New Course</h1>
            <p className="text-slate-400 text-sm mt-1">
              Add a new physics module with title, description, and thumbnail URL.
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm text-center font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Course Title *
              </label>
              <input
                id="course-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Physics: Quantum Mechanics & Atomic Structure"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Course Description *
              </label>
              <textarea
                id="course-description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of topics, syllabus, and exam target (JEE/NEET)..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Thumbnail URL (optional)
              </label>
              <input
                id="course-thumbnail-url"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Enter a direct image URL. Leave empty to use default thumbnail.
              </p>
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
                id="submit-course-btn"
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50"
              >
                {loading ? "Creating..." : "Insert Course"}
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
