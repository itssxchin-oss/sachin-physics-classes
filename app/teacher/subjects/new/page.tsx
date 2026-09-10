"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function NewSubjectPage() {
  const [batches, setBatches] = useState<{ id: string; title: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderNumber, setOrderNumber] = useState<number>(1);

  const [batchesLoading, setBatchesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    batch?: string;
    title?: string;
    orderNumber?: string;
    submit?: string;
  }>({});

  const router = useRouter();
  const supabase = createClient();

  // Load batches for dropdown
  useEffect(() => {
    let cancelled = false;

    async function fetchBatches() {
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (!error && data && !cancelled) {
          setBatches(data as { id: string; title: string }[]);
          if (data.length > 0) setSelectedBatchId(data[0].id);
        }
      } catch {
        // Fallback handled in UI
      } finally {
        if (!cancelled) setBatchesLoading(false);
      }
    }

    fetchBatches();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function validate(): boolean {
    const next: typeof errors = {};

    if (!selectedBatchId) next.batch = "Please select a batch.";
    if (!title.trim()) next.title = "Subject title is required.";
    if (!orderNumber || orderNumber < 1)
      next.orderNumber = "Order number must be at least 1.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setErrors({ submit: "Unauthorized: only the teacher account can add subjects." });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("subjects").insert({
        batch_id: selectedBatchId,
        title: title.trim(),
        description: description.trim(),
        order_number: Number(orderNumber),
      });

      if (insertError) {
        if (insertError.message.includes("unique") || insertError.code === "23505") {
          setErrors({
            submit: `A subject with order number ${orderNumber} already exists in this batch. Choose a different number.`,
          });
        } else {
          setErrors({ submit: `Failed to create subject: ${insertError.message}` });
        }
        setLoading(false);
        return;
      }

      setMessage("Subject created successfully! Redirecting...");
      setTimeout(() => {
        router.push("/teacher/dashboard?success=subject-created");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrors({
        submit: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
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
            <span className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-cyan-500/30 uppercase tracking-wider">
              📘 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Add New Subject</h1>
            <p className="text-slate-400 text-sm mt-1">
              Add a new subject (e.g. &quot;Physics&quot;) inside a selected Batch.
            </p>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm text-center font-medium">
              {message}
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm text-center font-medium">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Batch dropdown */}
            <div>
              <label htmlFor="subject-batch-dropdown" className="block text-sm font-medium text-slate-200 mb-2">
                Batch <span className="text-red-400">*</span>
              </label>

              {batchesLoading ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                  Loading batches...
                </div>
              ) : batches.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  No batches found.{" "}
                  <Link href="/teacher/batches/new" className="text-cyan-400 hover:underline">
                    Create a batch first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="subject-batch-dropdown"
                  required
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    if (errors.batch) setErrors((p) => ({ ...p, batch: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition-all ${
                    errors.batch ? "border-red-500/60" : "border-white/20 hover:border-white/30"
                  }`}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900">
                      {b.title}
                    </option>
                  ))}
                </select>
              )}

              {errors.batch && <p className="mt-1.5 text-xs text-red-400">{errors.batch}</p>}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="subject-title" className="block text-sm font-medium text-slate-200 mb-2">
                Subject Title <span className="text-red-400">*</span>
              </label>
              <input
                id="subject-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
                }}
                placeholder="e.g. Physics, Chemistry, Mathematics..."
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                  errors.title ? "border-red-500/60" : "border-white/15 hover:border-white/25"
                }`}
              />
              {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
            </div>

            {/* Order Number */}
            <div>
              <label htmlFor="subject-order" className="block text-sm font-medium text-slate-200 mb-2">
                Order Number <span className="text-red-400">*</span>
              </label>
              <input
                id="subject-order"
                type="number"
                min={1}
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(Number(e.target.value));
                  if (errors.orderNumber) setErrors((p) => ({ ...p, orderNumber: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                  errors.orderNumber ? "border-red-500/60" : "border-white/15 hover:border-white/25"
                }`}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Display position within the batch (1-based).
              </p>
              {errors.orderNumber && <p className="mt-1 text-xs text-red-400">{errors.orderNumber}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="subject-description" className="block text-sm font-medium text-slate-200 mb-2">
                Description <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="subject-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of subject syllabus covered in this batch..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 hover:border-white/25 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
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
                id="create-subject-submit"
                type="submit"
                disabled={loading || batchesLoading || batches.length === 0}
                className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Creating..." : "📘 Create Subject"}
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
