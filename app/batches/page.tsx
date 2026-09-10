import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import EnrollBatchButton from "./EnrollBatchButton";

interface Batch {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number | null;
  created_at: string;
}

export default async function BatchesPage() {
  const supabase = await createClient();

  // Auth guard
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const userId = authData.user.id;

  // Fetch all batches
  let batches: Batch[] = [];
  let enrolledBatchIds = new Set<string>();

  try {
    const { data: batchesData } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false });
    if (batchesData) batches = batchesData as Batch[];

    // Fetch this student's batch enrollments
    const { data: enrollmentsData } = await supabase
      .from("batch_enrollments")
      .select("batch_id")
      .eq("student_id", userId);
    if (enrollmentsData) {
      enrolledBatchIds = new Set(enrollmentsData.map((e: any) => e.batch_id));
    }
  } catch (err) {
    console.error("Error fetching batches:", err);
  }

  return (
    <StudentSidebarLayout pageTitle="Browse Batches">
      <div className="w-full max-w-7xl mx-auto min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-purple-500/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>📦</span> All Batches
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Explore <span className="gradient-text">Batches</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Enroll in a batch to access its subjects, chapters, and lectures.
          </p>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-white/10">
            <span className="text-6xl block mb-4">📦</span>
            <h2 className="text-xl font-bold text-white mb-2">No Batches Available Yet</h2>
            <p className="text-slate-400">Check back soon — batches will appear here once published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => {
              const isEnrolled = enrolledBatchIds.has(batch.id);
              const isFree = !batch.price || batch.price === 0;

              return (
                <div
                  key={batch.id}
                  className="glass rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-purple-900/40 to-slate-900 flex-shrink-0">
                    {batch.thumbnail_url ? (
                      <Image
                        src={batch.thumbnail_url}
                        alt={batch.title}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-30">📦</span>
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute top-3 right-3">
                      {isFree ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-bold shadow">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-xs font-bold shadow">
                          ₹{batch.price}
                        </span>
                      )}
                    </div>
                    {/* Enrolled badge */}
                    {isEnrolled && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold shadow flex items-center gap-1">
                          ✓ Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-base leading-snug mb-2 line-clamp-2">
                      {batch.title}
                    </h3>
                    {batch.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">
                        {batch.description}
                      </p>
                    )}

                    <div className="mt-auto pt-3 border-t border-white/5">
                      {isEnrolled ? (
                        <Link
                          href={`/batches/${batch.id}`}
                          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all hover:scale-[1.02]"
                        >
                          📖 Study Now →
                        </Link>
                      ) : (
                        <EnrollBatchButton batchId={batch.id} price={batch.price} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentSidebarLayout>
  );
}
