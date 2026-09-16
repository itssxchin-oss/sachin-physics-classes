import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import EnrollBatchButton from "../EnrollBatchButton";

// Subject icon helper based on subject name
const getSubjectIcon = (title: string, index: number) => {
  const lower = title.toLowerCase();
  if (lower.includes("physics")) return "⚛️";
  if (lower.includes("chem") || lower.includes("organic") || lower.includes("inorganic")) return "🧪";
  if (lower.includes("math") || lower.includes("maths")) return "📐";
  if (lower.includes("bio") || lower.includes("botany") || lower.includes("zoology")) return "🧬";
  if (lower.includes("notice") || lower.includes("announcement") || lower.includes("dpp")) return "📢";
  const defaultIcons = ["📚", "⚡", "🔮", "🌊", "⚗️", "🌸"];
  return defaultIcons[index % defaultIcons.length];
};

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
      <div className="w-full max-w-7xl mx-auto min-w-0 space-y-8">
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
                      Select a subject below to view chapters
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
          /* PW Style Compact Horizontal Subjects Container (Matching Screenshot) */
          <div className="glass rounded-3xl border border-white/10 p-6 sm:p-8 fade-up space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Subjects
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {subjects.map((subject, idx) => {
                const icon = getSubjectIcon(subject.title, idx);
                const chapterCount = chapterCountBySubject[subject.id] || 0;

                return (
                  <Link
                    key={subject.id}
                    href={`/batches/${batchId}/subjects/${subject.id}`}
                    className="group rounded-2xl bg-[#12151e] hover:bg-[#1a1e2b] border border-slate-800 hover:border-blue-500/60 p-4 flex items-center gap-3.5 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-blue-950/40"
                  >
                    {/* Circular Icon Badge */}
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/15 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      {icon}
                    </div>

                    {/* Subject Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-sm sm:text-base leading-snug truncate group-hover:text-blue-300 transition-colors">
                        {subject.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        {chapterCount} {chapterCount === 1 ? "Chapter" : "Chapters"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </StudentSidebarLayout>
  );
}
