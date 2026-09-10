"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function NewBatchPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [price, setPrice] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Batch title is required.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // 1. Verify teacher auth
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: only the teacher account can create batches.");
        setLoading(false);
        return;
      }

      // 2. Insert into batches table
      const { error: insertError } = await supabase
        .from("batches")
        .insert({
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
          price: Number(price) || 0,
          teacher_id: user.id,
        });

      if (insertError) {
        setError(`Failed to create batch: ${insertError.message}`);
      } else {
        setMessage("Batch created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/teacher/dashboard?success=batch-created");
          router.refresh();
        }, 1000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-24 w-full">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          ← Back to Teacher Dashboard
        </Link>

        <div className="glass p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl fade-up">
          <div className="mb-8">
            <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-purple-500/30 uppercase tracking-wider">
              📦 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Create New Batch</h1>
            <p className="text-slate-400 text-sm mt-1">
              Add a new batch (e.g., &quot;Class 10th Batch&quot;) to structure subjects, chapters, and lectures.
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
              <label htmlFor="batch-title" className="block text-sm font-medium text-slate-200 mb-2">
                Batch Title <span className="text-red-400">*</span>
              </label>
              <input
                id="batch-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Class 10th Batch, Class 12th JEE Physics Batch"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="batch-description" className="block text-sm font-medium text-slate-200 mb-2">
                Description <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="batch-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of target students, syllabus coverage, schedule..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label htmlFor="batch-thumbnail-url" className="block text-sm font-medium text-slate-200 mb-2">
                Thumbnail URL <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="batch-thumbnail-url"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/batch-thumbnail.jpg"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="batch-price" className="block text-sm font-medium text-slate-200 mb-2">
                Price (₹) <span className="text-red-400">*</span>
              </label>
              <input
                id="batch-price"
                type="number"
                min={0}
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Set to 0 for free batches or enter price in INR.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <Link
                href="/teacher/dashboard"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-sm transition-all"
              >
                Cancel
              </Link>
              <button
                id="submit-batch-btn"
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Creating..." : "＋ Create Batch"}
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
