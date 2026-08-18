"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";

interface DeleteLectureButtonProps {
  lectureId: string;
  lectureTitle: string;
}

export default function DeleteLectureButton({
  lectureId,
  lectureTitle,
}: DeleteLectureButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    setToast(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setToast({ type: "error", text: "Unauthorized: teacher only." });
        setDeleting(false);
        return;
      }

      // Delete related progress records first (students may have marked this lecture complete).
      const { error: progressError } = await supabase
        .from("progress")
        .delete()
        .eq("lecture_id", lectureId);

      if (progressError) {
        setToast({
          type: "error",
          text: `Failed to delete lecture progress: ${progressError.message}`,
        });
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("lectures")
        .delete()
        .eq("id", lectureId);

      if (error) {
        setToast({ type: "error", text: `Failed to delete lecture: ${error.message}` });
        setDeleting(false);
        return;
      }

      setOpen(false);
      setToast({ type: "success", text: "Lecture deleted successfully." });
      router.refresh();
    } catch (err: unknown) {
      setToast({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete lecture ${lectureTitle}`}
        title="Delete lecture"
        className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Delete lecture confirmation"
          onClick={() => {
            if (!deleting) setOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass rounded-3xl border border-white/15 shadow-2xl p-8 fade-up"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Delete Lecture?</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">&quot;{lectureTitle}&quot;</span>?
            </p>
            <p className="text-slate-400 text-xs mb-6">
              This will also delete all progress records for this lecture.
            </p>

            {toast && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm text-center font-medium ${
                  toast.type === "success"
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-200"
                    : "bg-red-500/20 border border-red-500/30 text-red-200"
                }`}
              >
                {toast.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-semibold text-sm transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Lecture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && toast.type === "success" && !open && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl glass border border-emerald-500/30 text-emerald-200 text-sm font-semibold shadow-2xl fade-up">
          ✓ {toast.text}
        </div>
      )}
    </>
  );
}