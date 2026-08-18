"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";
import {
  FileText,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Upload,
  Loader2,
  Paperclip,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface LectureMaterial {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
}

export default function LectureMaterialsPage() {
  const params = useParams<{ lectureId: string }>();
  const lectureId = params?.lectureId;

  const [lectureTitle, setLectureTitle] = useState<string>("");
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notifications
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Stable Supabase client — createBrowserClient already deduplicates internally,
  // but useMemo ensures we never pass a changing reference into useEffect deps.
  const supabase = useMemo(() => createClient(), []);

  // Standalone helper: fetch materials for a given lectureId.
  // Uses the stable `supabase` from useMemo, so no useCallback needed.
  async function loadMaterials(lecId: string) {
    const { data, error: err } = await supabase
      .from("lecture_materials")
      .select("*")
      .eq("lecture_id", lecId)
      .order("uploaded_at", { ascending: false });

    if (!err && data) {
      setMaterials(data as LectureMaterial[]);
    }
  }

  // Primary data load on mount / navigation
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!lectureId) return;

      // Reset state for fresh navigation
      setLoading(true);
      setMaterials([]);
      setLectureTitle("");
      setError(null);
      setMessage(null);

      try {
        // 1. Auth gate — must be teacher
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (!user || user.email !== TEACHER_EMAIL) {
          router.replace("/courses");
          return;
        }

        // 2. Fire BOTH fetches in parallel — materials load independently
        //    of lecture title. Promise.allSettled ensures neither blocks the other.
        const [materialsResult, lectureResult] = await Promise.allSettled([
          supabase
            .from("lecture_materials")
            .select("*")
            .eq("lecture_id", lectureId)
            .order("uploaded_at", { ascending: false }),
          supabase
            .from("lectures")
            .select("title")
            .eq("id", lectureId)
            .single(),
        ]);

        if (cancelled) return;

        // Process materials result
        if (materialsResult.status === "fulfilled") {
          const { data, error: matErr } = materialsResult.value;
          if (!matErr && data) {
            setMaterials(data as LectureMaterial[]);
          }
        }

        // Process lecture title result
        if (lectureResult.status === "fulfilled") {
          const { data } = lectureResult.value;
          if (data?.title) {
            setLectureTitle(data.title);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
    // supabase is stable (useMemo with []), router is stable from Next.js,
    // so only lectureId drives re-execution on navigation.
  }, [lectureId, supabase, router]);

  // Handle Upload Submission
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title for the material.");
      return;
    }

    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only .pdf files are allowed.");
      return;
    }

    if (!lectureId) return;

    setUploading(true);

    try {
      // Re-verify teacher email
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: Only the teacher can upload materials.");
        setUploading(false);
        return;
      }

      // a. Upload file to Supabase Storage bucket "lecture-materials"
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${lectureId}/${Date.now()}-${cleanFileName}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("lecture-materials")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) {
        throw new Error(`Storage upload failed: ${uploadErr.message}`);
      }

      // b. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("lecture-materials")
        .getPublicUrl(uploadData.path);

      const fileUrl = publicUrlData.publicUrl;

      // c. Insert row into "lecture_materials" table and select created record
      const { data: insertedData, error: insertErr } = await supabase
        .from("lecture_materials")
        .insert({
          lecture_id: lectureId,
          title: title.trim(),
          file_url: fileUrl,
          file_type: "pdf",
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(`Database record insert failed: ${insertErr.message}`);
      }

      // Immediately update local state with returned row
      if (insertedData) {
        const newMaterial = insertedData as LectureMaterial;
        setMaterials((prev) => [newMaterial, ...prev.filter((m) => m.id !== newMaterial.id)]);
      }

      setMessage("Material uploaded successfully!");
      setTitle("");
      setFile(null);

      // Reset file input element
      const fileInput = document.getElementById("material-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Also re-fetch from DB to guarantee sync
      await loadMaterials(lectureId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Material Deletion
  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    if (!lectureId) return;

    setDeletingId(id);
    setMessage(null);
    setError(null);

    try {
      // Re-verify teacher auth
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: Only the teacher can delete materials.");
        setDeletingId(null);
        return;
      }

      // Delete database row
      const { error: deleteErr } = await supabase
        .from("lecture_materials")
        .delete()
        .eq("id", id);

      if (deleteErr) {
        throw new Error(`Failed to delete record: ${deleteErr.message}`);
      }

      // Optimistically remove from state
      setMaterials((prev) => prev.filter((m) => m.id !== id));

      // Optional: Clean up storage file if url matches bucket structure
      try {
        const urlParts = fileUrl.split("/lecture-materials/");
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from("lecture-materials").remove([filePath]);
        }
      } catch {
        // Storage cleanup errors silently ignored
      }

      setMessage("Material deleted successfully.");
      await loadMaterials(lectureId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion failed.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-400 text-sm font-medium">Loading lecture materials...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-24 w-full">
        {/* Back navigation */}
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teacher Dashboard
        </Link>

        {/* Main Card */}
        <div className="glass p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-8 fade-up">
          {/* Header Context */}
          <div className="border-b border-white/10 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Paperclip className="w-3.5 h-3.5" /> Lecture Materials Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lectureTitle ? (
                <>
                  Materials for <span className="gradient-text">&quot;{lectureTitle}&quot;</span>
                </>
              ) : (
                "Lecture Materials"
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload PDF notes, practice sheets, and formula guides for students enrolled in this lecture.
            </p>
          </div>

          {/* Feedback Banners */}
          {message && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-sm font-medium flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Existing Materials List */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Uploaded Materials ({materials.length})
            </h2>

            {materials.length === 0 ? (
              <div className="text-center py-10 px-4 glass rounded-2xl border border-white/5 bg-white/[0.01]">
                <FileText className="w-12 h-12 mx-auto text-slate-500 mb-3 opacity-60" />
                <p className="text-sm font-medium text-slate-300">No materials uploaded yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Use the upload form below to attach PDF notes or problem sets.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-4 rounded-2xl glass border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate" title={mat.title}>
                          {mat.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">
                            PDF
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {mat.uploaded_at
                              ? new Date(mat.uploaded_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Just now"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <span>View / Download</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(mat.id, mat.file_url)}
                        disabled={deletingId === mat.id}
                        aria-label={`Delete ${mat.title}`}
                        title="Delete material"
                        className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        {deletingId === mat.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Form */}
          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Upload New Material
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Attach a PDF document to this lecture for enrolled students.
            </p>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Material Title / Description *
                </label>
                <input
                  id="material-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 1 Class Notes, Practice Worksheet 2"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select PDF File *
                </label>
                <input
                  id="material-file-input"
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Only .pdf files are accepted. Max size depends on Supabase storage limits.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="upload-material-btn"
                  type="submit"
                  disabled={uploading || !title.trim() || !file}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm btn-glow transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading PDF...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Material</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}
