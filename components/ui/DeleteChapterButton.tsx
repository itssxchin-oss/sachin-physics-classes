"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TEACHER_EMAIL } from "@/lib/constants";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

interface DeleteChapterButtonProps {
  chapterId: string;
  chapterTitle: string;
}

export default function DeleteChapterButton({
  chapterId,
  chapterTitle,
}: DeleteChapterButtonProps) {
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

      const { error: deleteError } = await supabase
        .from("chapters")
        .delete()
        .eq("id", chapterId);

      if (deleteError) {
        setError(`Failed to delete chapter: ${deleteError.message}`);
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
        aria-label={`Delete chapter ${chapterTitle}`}
        title="Delete chapter"
        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
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
        title="Delete Chapter?"
        itemName={chapterTitle}
        warningText="This action cannot be undone. All lectures within this chapter will also be deleted."
        deleting={deleting}
        confirmLabel="Delete Chapter"
        error={error}
      />

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-200 text-sm font-semibold shadow-2xl fade-up">
          ✓ Chapter deleted successfully.
        </div>
      )}
    </>
  );
}
