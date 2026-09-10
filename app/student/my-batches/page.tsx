import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";

interface Batch {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number | null;
}

export default async function MyBatchesPage() {
  const supabase = await createClient();

  // Auth guard
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) redirect("/login");
  const userId = authData.user.id;

  let enrolledBatches: Batch[] = [];

  try {
    // Fetch enrolled batches by joining batch_enrollments → batches
    const { data } = await supabase
      .from("batch_enrollments")
      .select("enrolled_at, batches(*)")
      .eq("student_id", userId)
      .order("enrolled_at", { ascending: false });

    if (data) {
      enrolledBatches = data
        .map((row: any) => row.batches)
        .filter(Boolean) as Batch[];
    }
  } catch (err) {
    console.error("Error fetching my batches:", err);
  }

  return (
    <StudentSidebarLayout pageTitle="My Batches">
      <div className="w-full max-w-7xl mx-auto min-w-0">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>🎓</span> My Batches
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            My <span className="gradient-text">Enrolled Batches</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Continue learning from where you left off.
          </p>
        </div>

        {enrolledBatches.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-white/10">
            <span className="text-6xl block mb-4">🎓</span>
            <h2 className="text-xl font-bold text-white mb-2">No Batches Yet</h2>
            <p className="text-slate-400 mb-6">
              You haven&apos;t enrolled in any batch yet.
            </p>
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all hover:scale-105"
            >
              📦 Browse All Batches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledBatches.map((batch) => {
              const isFree = !batch.price || batch.price === 0;
              return (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="glass rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/10 group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-cyan-900/40 to-slate-900 flex-shrink-0">
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
                    {/* Enrolled badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold shadow flex items-center gap-1">
                        ✓ Enrolled
                      </span>
                    </div>
                    {/* Price badge */}
                    <div className="absolute top-3 right-3">
                      {isFree ? (
                        <span className="px-2.5 py-1 rounded-full bg-slate-700/90 text-slate-300 text-xs font-bold">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-purple-700/90 text-white text-xs font-bold">
                          ₹{batch.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-base leading-snug mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {batch.title}
                    </h3>
                    {batch.description && (
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                        {batch.description}
                      </p>
                    )}
                    <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-cyan-400 font-semibold">
                        Continue Learning →
                      </span>
                      <span className="text-xl">📖</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {enrolledBatches.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium"
            >
              📦 Browse more batches →
            </Link>
          </div>
        )}
      </div>
    </StudentSidebarLayout>
  );
}
