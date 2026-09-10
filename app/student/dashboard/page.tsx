import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import type { Batch, Chapter, Lecture } from "@/lib/database.types";
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Video
} from "lucide-react";

export default async function StudentDashboardPage() {
  const supabase = await createClient();

  // 1. Auth Guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  // 2. Fetch student's enrolled batches
  const { data: enrollmentsData } = await supabase
    .from("batch_enrollments")
    .select("batch_id, enrolled_at, batches(*)")
    .eq("student_id", userId);

  const enrolledBatchesWithStats: Array<{
    batch: Batch;
    enrolledAt: string;
    totalLectures: number;
    completedLectures: number;
    progressPct: number;
  }> = [];

  let grandTotalLectures = 0;
  let grandCompletedLectures = 0;

  if (enrollmentsData && enrollmentsData.length > 0) {
    for (const item of enrollmentsData) {
      const batch = item.batches as unknown as Batch;
      if (!batch) continue;

      // Fetch subjects for this batch
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id")
        .eq("batch_id", batch.id);

      const subjectIds = (subjectsData || []).map((s: { id: string }) => s.id);

      // Fetch chapters for these subjects
      let chapterIds: string[] = [];
      if (subjectIds.length > 0) {
        const { data: chaptersData } = await supabase
          .from("chapters")
          .select("id")
          .in("subject_id", subjectIds);

        chapterIds = (chaptersData || []).map((c: { id: string }) => c.id);
      }

      // Fetch lectures for these chapters
      let lectureIds: string[] = [];
      if (chapterIds.length > 0) {
        const { data: lecturesData } = await supabase
          .from("lectures")
          .select("id")
          .in("chapter_id", chapterIds);

        lectureIds = (lecturesData || []).map((l: { id: string }) => l.id);
      }

      const totalLectures = lectureIds.length;
      let completedLectures = 0;

      if (totalLectures > 0) {
        const { count } = await supabase
          .from("progress")
          .select("*", { count: "exact", head: true })
          .eq("student_id", userId)
          .eq("completed", true)
          .in("lecture_id", lectureIds);

        completedLectures = count || 0;
      }

      const progressPct =
        totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

      grandTotalLectures += totalLectures;
      grandCompletedLectures += completedLectures;

      enrolledBatchesWithStats.push({
        batch,
        enrolledAt: item.enrolled_at,
        totalLectures,
        completedLectures,
        progressPct,
      });
    }
  }

  const overallProgressPct =
    grandTotalLectures > 0
      ? Math.round((grandCompletedLectures / grandTotalLectures) * 100)
      : 0;

  // 3. Fetch recently completed lectures for activity timeline
  let recentLecturesList: Array<{
    lecture: Lecture;
    chapterTitle?: string;
    completedAt?: string | null;
  }> = [];

  const { data: recentProgressData } = await supabase
    .from("progress")
    .select("lecture_id, completed_at")
    .eq("student_id", userId)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(5);

  if (recentProgressData && recentProgressData.length > 0) {
    const recentLectureIds = recentProgressData.map((rp: { lecture_id: string }) => rp.lecture_id);

    const { data: recentLecs } = await supabase
      .from("lectures")
      .select("*")
      .in("id", recentLectureIds);

    if (recentLecs) {
      const lecMap = new Map<string, Lecture>(recentLecs.map((l: any) => [l.id, l as Lecture]));

      for (const rp of recentProgressData) {
        const lec = lecMap.get(rp.lecture_id);
        if (lec) {
          let chapterTitle: string | undefined;
          if (lec.chapter_id) {
            const { data: chData } = await supabase
              .from("chapters")
              .select("title")
              .eq("id", lec.chapter_id)
              .single();

            chapterTitle = chData?.title;
          }

          recentLecturesList.push({
            lecture: lec,
            chapterTitle,
            completedAt: rp.completed_at,
          });
        }
      }
    }
  }

  return (
    <StudentSidebarLayout pageTitle="Student Overview">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Welcome Hero Banner */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden fade-up">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome Back, <span className="gradient-text">{user.email?.split("@")[0]}</span>! 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Track your batch progress, resume video lectures, and keep building your Physics foundation.
            </p>
          </div>
        </div>

        {/* ── TOP STATS GRID (3 CARDS) ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 fade-up">
          {/* Stat 1: Enrolled Batches */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Enrolled Batches
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {enrolledBatchesWithStats.length}
              </h2>
              <p className="text-xs text-purple-400 mt-1 font-medium">Active courses</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl font-bold">
              📦
            </div>
          </div>

          {/* Stat 2: Overall Progress */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Overall Progress
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {overallProgressPct}%
              </h2>
              <p className="text-xs text-cyan-400 mt-1 font-medium">Syllabus completed</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl font-bold">
              📊
            </div>
          </div>

          {/* Stat 3: Lectures Watched */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Lectures Watched
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {grandCompletedLectures}
              </h2>
              <p className="text-xs text-emerald-400 mt-1 font-medium">
                {grandTotalLectures > 0 ? `Out of ${grandTotalLectures} lessons` : "Completed videos"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl font-bold">
              📹
            </div>
          </div>
        </div>

        {/* ── MY ENROLLED BATCHES SECTION ────────────────────────────── */}
        <div className="space-y-4 fade-up">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              <span>My Enrolled Batches</span>
            </h2>
            <Link
              href="/batches"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              Browse All Batches <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {enrolledBatchesWithStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledBatchesWithStats.map(({ batch, totalLectures, completedLectures, progressPct }) => (
                <div
                  key={batch.id}
                  className="glass p-6 rounded-3xl border border-white/10 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between space-y-5 card-hover"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                          Enrolled
                        </span>
                        <h3 className="font-extrabold text-white text-lg mt-1.5">
                          {batch.title}
                        </h3>
                      </div>
                      <span className="text-2xl">📦</span>
                    </div>

                    {batch.description && (
                      <p className="text-slate-400 text-xs line-clamp-2">
                        {batch.description}
                      </p>
                    )}
                  </div>

                  {/* Batch Progress Bar */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Batch Progress</span>
                      <span className="text-blue-400">
                        {completedLectures}/{totalLectures} lectures ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/batches/${batch.id}`}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-all btn-glow flex items-center justify-center gap-2"
                  >
                    <span>Study Batch</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass p-10 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">You aren&apos;t enrolled in any batch yet</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Join Sachin Sir&apos;s physics batches to access structured subjects, chapters, formula guides, and video lectures.
              </p>
              <Link
                href="/batches"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs btn-glow transition-all"
              >
                <span>Browse Available Batches</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* ── RECENTLY WATCHED LECTURES ──────────────────────────────── */}
        {recentLecturesList.length > 0 && (
          <div className="space-y-4 fade-up pt-4">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Recently Completed Lectures</span>
            </h2>

            <div className="space-y-3">
              {recentLecturesList.map(({ lecture, chapterTitle }) => (
                <Link
                  key={lecture.id}
                  href={`/courses/${lecture.course_id || "_"}/lecture/${lecture.id}`}
                  className="glass p-4 rounded-2xl border border-white/10 hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {chapterTitle && (
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider truncate">
                            {chapterTitle}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400">
                          ⏱️ {lecture.duration_mins || 45} mins
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors truncate">
                        {lecture.title}
                      </h4>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-white/5 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1">
                    <span>Rewatch</span>
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentSidebarLayout>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" />
    </svg>
  );
}