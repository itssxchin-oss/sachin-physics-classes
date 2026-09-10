"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

interface DeleteBatchButtonProps {
  batchId: string;
  batchTitle: string;
}

export default function DeleteBatchButton({
  batchId,
  batchTitle,
}: DeleteBatchButtonProps) {
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
        setErrorMsg("You must be signed in to delete a batch.");
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", batchId);

      if (error) {
        setErrorMsg(`Failed to delete batch: ${error.message}`);
        setDeleting(false);
        return;
      }

      setOpen(false);
      setToast("Batch deleted successfully.");
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
        aria-label={`Delete batch ${batchTitle}`}
        title="Delete batch"
        className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmDeleteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Batch?"
        itemName={batchTitle}
        warningText="This will also delete all subjects, chapters, and lectures inside this batch. This action cannot be undone."
        deleting={deleting}
        confirmLabel="Delete Batch"
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
