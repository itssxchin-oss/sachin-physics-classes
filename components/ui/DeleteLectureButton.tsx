"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

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
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user || user.email !== TEACHER_EMAIL) {
        setError("Unauthorized: teacher only.");
        setDeleting(false);
        return;
      }

      // Delete related progress records first.
      const { error: progressError } = await supabase
        .from("progress")
        .delete()
        .eq("lecture_id", lectureId);

      if (progressError) {
        setError(`Failed to delete lecture progress: ${progressError.message}`);
        setDeleting(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("lectures")
        .delete()
        .eq("id", lectureId);

      if (deleteError) {
        setError(`Failed to delete lecture: ${deleteError.message}`);
        setDeleting(false);
        return;
      }

      setOpen(false);
      setDeleting(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete lecture ${lectureTitle}`}
        title="Delete lecture"
        className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmDeleteModal
        isOpen={open}
        onClose={() => {
          if (!deleting) {
            setOpen(false);
            setError(null);
          }
        }}
        onConfirm={handleDelete}
        title="Delete Lecture?"
        itemName={lectureTitle}
        warningText="This will also delete all student progress records for this lecture. This action cannot be undone."
        deleting={deleting}
        confirmLabel="Delete Lecture"
        error={error}
      />

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-200 text-sm font-semibold shadow-2xl fade-up">
          ✓ Lecture deleted successfully.
        </div>
      )}
    </>
  );
}