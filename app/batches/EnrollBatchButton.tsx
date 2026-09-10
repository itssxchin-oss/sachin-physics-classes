"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enrollInBatch } from "./actions";

interface EnrollBatchButtonProps {
  batchId: string;
  price?: number | null;
}

export default function EnrollBatchButton({ batchId, price }: EnrollBatchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnroll = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await enrollInBatch(batchId);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const isFree = !price || price === 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleEnroll}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Enrolling…
          </>
        ) : (
          <>
            🎓 Enroll {isFree ? "— Free" : `— ₹${price}`}
          </>
        )}
      </button>
      {errorMsg && (
        <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-center">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
