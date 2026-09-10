"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

export default function NewLecturePage() {
  const [batches, setBatches] = useState<{ id: string; title: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; batch_id: string; title: string }[]>([]);
  const [chapters, setChapters] = useState<{ id: string; subject_id: string | null; title: string; order_number: number }[]>([]);

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");

  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [description, setDescription] = useState("");
  const [orderNumber, setOrderNumber] = useState<number>(1);
  const [durationMins, setDurationMins] = useState<number>(45);

  const [batchesLoading, setBatchesLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // 1. Fetch batches
  useEffect(() => {
    async function fetchBatches() {
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("id, title")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setBatches(data as { id: string; title: string }[]);
          setSelectedBatchId(data[0].id);
        }
      } catch {
        // Handled in UI
      } finally {
        setBatchesLoading(false);
      }
    }

    fetchBatches();
  }, [supabase]);

  // 2. Fetch all subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, batch_id, title")
          .order("order_number", { ascending: true });

        if (!error && data) {
          setSubjects(data as { id: string; batch_id: string; title: string }[]);
        }
      } catch {
        // Handled in UI
      } finally {
        setSubjectsLoading(false);
      }
    }

    fetchSubjects();
  }, [supabase]);

  // Filter subjects whenever selectedBatchId changes
  const filteredSubjects = subjects.filter((s) => s.batch_id === selectedBatchId);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [selectedBatchId, subjects]);

  // 3. Fetch chapters for selectedSubjectId
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId("");
      setChaptersLoading(false);
      return;
    }

    async function fetchChapters() {
      setChaptersLoading(true);
      try {
        const { data, error } = await supabase
          .from("chapters")
          .select("id, subject_id, title, order_number")
          .eq("subject_id", selectedSubjectId)
          .order("order_number", { ascending: true });

        if (!error && data && data.length > 0) {
          setChapters(data as any[]);
          setSelectedChapterId(data[0].id);
        } else {
          setChapters([]);
          setSelectedChapterId("");
        }
      } catch {
        setChapters([]);
        setSelectedChapterId("");
      } finally {
        setChaptersLoading(false);
      }
    }

    fetchChapters();
  }, [selectedSubjectId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      // Verify teacher auth
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: only the teacher account can add lectures.");
        setLoading(false);
        return;
      }

      if (!selectedBatchId) {
        setError("Please select a batch.");
        setLoading(false);
        return;
      }

      if (!selectedSubjectId) {
        setError("Please select a subject. Create a subject first if none exists.");
        setLoading(false);
        return;
      }

      if (!selectedChapterId) {
        setError("Please select a chapter. Create a chapter first if none exists.");
        setLoading(false);
        return;
      }

      if (!title.trim()) {
        setError("Lecture title is required.");
        setLoading(false);
        return;
      }

      if (!youtubeUrl.trim()) {
        setError("YouTube URL is required.");
        setLoading(false);
        return;
      }

      // Insert into lectures table using chapter_id
      const { error: insertError } = await supabase
        .from("lectures")
        .insert({
          chapter_id: selectedChapterId,
          title: title.trim(),
          youtube_url: youtubeUrl.trim(),
          description: description.trim(),
          order_number: Number(orderNumber),
          duration_mins: Number(durationMins),
        });

      if (insertError) {
        setError(`Failed to add lecture: ${insertError.message}`);
      } else {
        setMessage("Lecture video inserted successfully! Redirecting...");
        setTimeout(() => {
          router.push("/teacher/dashboard?success=lecture-created");
          router.refresh();
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

        {/* Form Container */}
        <div className="glass p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl fade-up">
          <div className="mb-8">
            <span className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3.5 py-1 rounded-full mb-3 border border-indigo-500/30 uppercase tracking-wider">
              📹 Teacher Creator Tools
            </span>
            <h1 className="text-3xl font-extrabold text-white">Add New Lecture Video</h1>
            <p className="text-slate-400 text-sm mt-1">
              Select a batch, subject, and chapter to upload a new video lecture.
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
            {/* Step 1: Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                1. Select Target Batch <span className="text-red-400">*</span>
              </label>
              {batchesLoading ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                  Loading batches...
                </div>
              ) : batches.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  No batches available.{" "}
                  <Link href="/teacher/batches/new" className="text-purple-400 hover:underline">
                    Create a batch first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="lecture-batch-dropdown"
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id} className="bg-slate-900">
                      {batch.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                2. Select Target Subject <span className="text-red-400">*</span>
              </label>
              {subjectsLoading ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                  Loading subjects...
                </div>
              ) : !selectedBatchId ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  Please select a batch first.
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  No subjects found in this batch.{" "}
                  <Link href="/teacher/subjects/new" className="text-cyan-400 hover:underline">
                    Create a subject first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="lecture-subject-dropdown"
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id} className="bg-slate-900">
                      {sub.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 3: Chapter Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                3. Select Target Chapter <span className="text-red-400">*</span>
              </label>
              {chaptersLoading ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400 animate-pulse">
                  Loading chapters...
                </div>
              ) : !selectedSubjectId ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  Please select a subject first.
                </div>
              ) : chapters.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-slate-400">
                  No chapters found in this subject.{" "}
                  <Link href="/teacher/chapters/new" className="text-emerald-400 hover:underline">
                    Create a chapter first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  id="lecture-chapter-dropdown"
                  required
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id} className="bg-slate-900">
                      Chapter {ch.order_number}: {ch.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Lecture Title */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Lecture Title <span className="text-red-400">*</span>
              </label>
              <input
                id="lecture-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Body Diagrams & Friction Problems"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* YouTube Video URL */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                YouTube Video URL <span className="text-red-400">*</span>
              </label>
              <input
                id="lecture-youtube-input"
                type="url"
                required
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Order Number & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Order Number (Position in Chapter) <span className="text-red-400">*</span>
                </label>
                <input
                  id="lecture-order-input"
                  type="number"
                  min={1}
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Duration (minutes) <span className="text-red-400">*</span>
                </label>
                <input
                  id="lecture-duration-input"
                  type="number"
                  min={1}
                  required
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Lecture Description
              </label>
              <textarea
                id="lecture-desc-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key concepts, formula derivations, and problem sets covered..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                id="submit-lecture-btn"
                type="submit"
                disabled={loading || batches.length === 0 || filteredSubjects.length === 0 || chapters.length === 0}
                className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm btn-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Inserting..." : "Insert Lecture"}
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