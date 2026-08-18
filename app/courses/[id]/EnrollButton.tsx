"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { enrollInCourse } from "./actions";

interface EnrollButtonProps {
  courseId: string;
}

export default function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnroll = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await enrollInCourse(courseId);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        // Server action already called revalidatePath; hard-refresh to show enrolled state
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleEnroll}
        disabled={isPending}
        id="enroll-now-btn"
        className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
      >
        {isPending ? (
          <>
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Enrolling…
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Enroll Now — Free
          </>
        )}
      </button>

      {errorMsg && (
        <p className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
