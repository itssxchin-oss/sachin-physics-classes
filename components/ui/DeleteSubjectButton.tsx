"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

interface DeleteSubjectButtonProps {
  subjectId: string;
  subjectTitle: string;
}

export default function DeleteSubjectButton({
  subjectId,
  subjectTitle,
}: DeleteSubjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        setErrorMsg("Unauthorized: teacher only.");
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subjectId);

      if (error) {
        setErrorMsg(`Failed to delete subject: ${error.message}`);
        setDeleting(false);
        return;
      }

      setOpen(false);
      setToast("Subject deleted successfully.");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete subject ${subjectTitle}`}
        title="Delete subject"
        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <ConfirmDeleteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Subject?"
        itemName={subjectTitle}
        warningText="This will also delete all chapters and lectures inside this subject. This action cannot be undone."
        deleting={deleting}
        confirmLabel="Delete Subject"
        error={errorMsg}
      />

      {toast && !open && (
        <div className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl glass border border-emerald-500/30 text-emerald-200 text-sm font-semibold shadow-2xl fade-up">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
