import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import EnrollBatchButton from "../EnrollBatchButton";

// Subject card colour palette — cycles through these
const SUBJECT_COLORS = [
  { bg: "from-blue-600/30 to-blue-900/20", border: "border-blue-500/30", text: "text-blue-300", icon: "⚡" },
  { bg: "from-emerald-600/30 to-emerald-900/20", border: "border-emerald-500/30", text: "text-emerald-300", icon: "🌿" },
  { bg: "from-purple-600/30 to-purple-900/20", border: "border-purple-500/30", text: "text-purple-300", icon: "🔮" },
  { bg: "from-amber-600/30 to-amber-900/20", border: "border-amber-500/30", text: "text-amber-300", icon: "⚗️" },
  { bg: "from-pink-600/30 to-pink-900/20", border: "border-pink-500/30", text: "text-pink-300", icon: "🌸" },
  { bg: "from-cyan-600/30 to-cyan-900/20", border: "border-cyan-500/30", text: "text-cyan-300", icon: "🌊" },
];

interface BatchPageProps {
  params: { id: string };
}

export default async function BatchDetailPage({ params }: BatchPageProps) {
  const { id: batchId } = params;
  const supabase = await createClient();

  // Auth guard
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const userId = authData.user.id;

  let batch: any = null;
  let subjects: any[] = [];
  let isEnrolled = false;
  let chapterCountBySubject: Record<string, number> = {};

  try {
    // Fetch batch details
    const { data: batchData } = await supabase
      .from("batches")
      .select("*")
      .eq("id", batchId)
      .single();
    batch = batchData;

    if (!batch) redirect("/batches");

    // Check enrollment
    const { data: enrollData } = await supabase
      .from("batch_enrollments")
      .select("id")
      .eq("student_id", userId)
      .eq("batch_id", batchId)
      .maybeSingle();
    isEnrolled = !!enrollData;

    // Fetch subjects for this batch
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .eq("batch_id", batchId)
      .order("order_number", { ascending: true });
    subjects = subjectsData || [];

    // Get chapter counts per subject
    if (subjects.length > 0) {
      const subjectIds = subjects.map((s) => s.id);
      const { data: chaptersData } = await supabase
        .from("chapters")
        .select("id, subject_id")
        .in("subject_id", subjectIds);

      for (const ch of chaptersData || []) {
        if (ch.subject_id) {
          chapterCountBySubject[ch.subject_id] =
            (chapterCountBySubject[ch.subject_id] || 0) + 1;
        }
      }
    }
  } catch (err) {
    console.error("Error loading batch detail:", err);
  }

  if (!batch) {
    return (
      <StudentSidebarLayout pageTitle="Batch Not Found" backHref="/batches">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-8">
            <span className="text-5xl block mb-4">😕</span>
            <h2 className="text-xl font-bold text-white">Batch not found</h2>
            <Link href="/batches" className="mt-4 inline-block text-blue-400 hover:underline">
              ← Back to Batches
            </Link>
          </div>
        </div>
      </StudentSidebarLayout>
    );
  }

  const isFree = !batch.price || batch.price === 0;

  return (
    <StudentSidebarLayout pageTitle={batch.title} backHref="/batches">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        {/* Batch Hero */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Thumbnail */}
            <div className="relative sm:w-64 lg:w-80 h-48 sm:h-auto flex-shrink-0 bg-gradient-to-br from-purple-900/40 to-slate-900">
              {batch.thumbnail_url ? (
                <Image
                  src={batch.thumbnail_url}
                  alt={batch.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl opacity-20">📦</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                    📦 Batch
                  </span>
                  {isFree ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      FREE
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      ₹{batch.price}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                  {batch.title}
                </h1>
                {batch.description && (
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {batch.description}
                  </p>
                )}
              </div>

              <div className="mt-6">
                {isEnrolled ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                      ✓ Enrolled
                    </span>
                    <span className="text-slate-400 text-sm">
                      Select a subject below to start learning
                    </span>
                  </div>
                ) : (
                  <div className="max-w-xs">
                    <EnrollBatchButton batchId={batchId} price={batch.price} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subjects Grid or Lock Screen */}
        {!isEnrolled ? (
          // Not enrolled — show lock prompt
          <div className="glass rounded-2xl border border-white/10 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-3xl mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Enroll to Access Content
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              This batch contains {subjects.length} subject{subjects.length !== 1 ? "s" : ""} with
              chapters and lectures. Enroll to unlock full access.
            </p>
            <div className="max-w-xs mx-auto">
              <EnrollBatchButton batchId={batchId} price={batch.price} />
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="glass rounded-2xl border border-white/10 p-10 text-center">
            <span className="text-5xl block mb-4">📚</span>
            <h2 className="text-xl font-bold text-white mb-2">No Subjects Yet</h2>
            <p className="text-slate-400 text-sm">
              Subjects will be added to this batch soon. Check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-white">Subjects</h2>
              <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {subjects.length} total
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject, idx) => {
                const palette = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
                const chapterCount = chapterCountBySubject[subject.id] || 0;

                return (
                  <Link
                    key={subject.id}
                    href={`/batches/${batchId}/subjects/${subject.id}`}
                    className={`group glass rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:scale-[1.02] hover:shadow-xl ${palette.border}`}
                  >
                    {/* Icon Area */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette.bg} border ${palette.border} flex items-center justify-center text-2xl`}>
                      {palette.icon}
                    </div>

                    {/* Subject info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${palette.text}`}>
                          Subject #{subject.order_number}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-white transition-colors">
                        {subject.title}
                      </h3>
                      {subject.description && (
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-slate-400">
                        📂 {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                      </span>
                      <span className={`text-xs font-semibold ${palette.text} flex items-center gap-1`}>
                        Start <span>→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </StudentSidebarLayout>
  );
}
