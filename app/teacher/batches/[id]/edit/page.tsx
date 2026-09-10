"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function EditBatchPage() {
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [price, setPrice] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function loadBatch() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user || user.email !== TEACHER_EMAIL) {
          if (!cancelled) setUnauthorized(true);
          return;
        }

        const { data: batch, error: fetchError } = await supabase
          .from("batches")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError || !batch) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!cancelled) {
          setTitle(batch.title || "");
          setDescription(batch.description || "");
          setThumbnailUrl(batch.thumbnail_url || "");
          setPrice(batch.price ?? 0);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBatch();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: only the teacher account can edit batches.");
        setSaving(false);
        return;
      }

      if (!title.trim()) {
        setError("Batch title is required.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("batches")
        .update({
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailUrl.trim() || null,
          price: Number(price) || 0,
        })
        .eq("id", id);

      if (updateError) {
        setError(`Failed to update batch: ${updateError.message}`);
        setSaving(false);
        return;
      }

      router.push("/teacher/dashboard?updated=batch");
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
            <h1 className="text-3xl font-extrabold text-white">Edit Batch</h1>
            <p className="text-slate-400 text-sm mt-1">
              Update batch details, title, description, thumbnail, or price.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading batch details...</p>
            </div>
          )}

          {!loading && unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Unauthorized: only the teacher account can edit batches.
            </div>
          )}

          {!loading && notFound && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Batch not found. It may have been deleted.
            </div>
          )}

          {!loading && error && !notFound && !unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !unauthorized && !notFound && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Batch Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Class 10th Batch"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of this batch..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/batch-thumbnail.jpg"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
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
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50"
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
