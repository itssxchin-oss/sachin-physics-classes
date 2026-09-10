"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function EditSubjectPage() {
  const { id } = useParams<{ id: string }>();

  const [batches, setBatches] = useState<{ id: string; title: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
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
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user || user.email !== TEACHER_EMAIL) {
          if (!cancelled) setUnauthorized(true);
          return;
        }

        const { data: batchList } = await supabase
          .from("batches")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (batchList && !cancelled) {
          setBatches(batchList as { id: string; title: string }[]);
        }

        const { data: subject, error: fetchError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError || !subject) {
          if (!cancelled) setNotFound(true);
          return;
        }

        if (!cancelled) {
          setBatchId(subject.batch_id || "");
          setTitle(subject.title || "");
          setDescription(subject.description || "");
          setOrderNumber(subject.order_number ?? 1);
        }
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBatchesLoading(false);
        }
      }
    }

    loadData();

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
        setError("Unauthorized: only the teacher account can edit subjects.");
        setSaving(false);
        return;
      }

      if (!batchId) {
        setError("Please select a batch.");
        setSaving(false);
        return;
      }

      if (!title.trim()) {
        setError("Subject title is required.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("subjects")
        .update({
          batch_id: batchId,
          title: title.trim(),
          description: description.trim(),
          order_number: Number(orderNumber),
        })
        .eq("id", id);

      if (updateError) {
        setError(`Failed to update subject: ${updateError.message}`);
        setSaving(false);
        return;
      }

      router.push("/teacher/dashboard?updated=subject");
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
            <span className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-cyan-500/30 uppercase tracking-wider">
              📘 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Edit Subject</h1>
            <p className="text-slate-400 text-sm mt-1">
              Update subject details, order number, or batch assignment.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Loading subject details...</p>
            </div>
          )}

          {!loading && unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Unauthorized: only the teacher account can edit subjects.
            </div>
          )}

          {!loading && notFound && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              Subject not found. It may have been deleted.
            </div>
          )}

          {!loading && error && !notFound && !unauthorized && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !unauthorized && !notFound && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Batch */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Batch *
                </label>
                {batchesLoading ? (
                  <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                    Loading batches...
                  </div>
                ) : (
                  <select
                    id="edit-subject-batch-dropdown"
                    required
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id} className="bg-slate-900">
                        {batch.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Subject Title *
                </label>
                <input
                  id="edit-subject-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Order Number */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Order Number *
                </label>
                <input
                  id="edit-subject-order-input"
                  type="number"
                  min={1}
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-subject-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of topics covered in this subject..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                  id="update-subject-btn"
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50"
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
