import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDashboardPage() {
  // ── Auth guard ──────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    redirect("/login");
  }
  const currentUserId = authData.user.id;

  // ── State ───────────────────────────────────────────────────────────
  let enrolledCoursesCount = 0;
  let totalLecturesCount = 0;
  let completedLecturesCount = 0;
  let overallProgressPercent = 0;
  let enrolledCoursesList: any[] = [];
  let recentLectures: any[] = [];

  try {
    // ── 1. Fetch all enrollments for this student ──────────────────────
    const { data: enrollmentsData } = await supabase
      .from("enrollments")
      .select("course_id, enrolled_at, courses(*)")
      .eq("student_id", currentUserId);

    if (enrollmentsData && enrollmentsData.length > 0) {
      enrolledCoursesCount = enrollmentsData.length;

      // ── 2. For each enrolled course, calculate progress ──────────────
      //       using the exact chapter → lecture → progress chain.
      const courseStatsPromises = enrollmentsData.map(async (enrollment: any) => {
        const c = enrollment.courses || {};

        // Step 1 — chapters for this course
        const { data: chaptersData } = await supabase
          .from("chapters")
          .select("id")
          .eq("course_id", enrollment.course_id);

        const chapterIds = chaptersData?.map((ch: any) => ch.id) || [];

        // Step 2 — lectures for those chapters
        let lectureIds: string[] = [];
        if (chapterIds.length > 0) {
          const { data: lecturesData } = await supabase
            .from("lectures")
            .select("id")
            .in("chapter_id", chapterIds);

          lectureIds = lecturesData?.map((l: any) => l.id) || [];
        }
        const totalLectures = lectureIds.length;

        // Step 3 — completed lectures from progress table
        let completedLectures = 0;
        if (lectureIds.length > 0) {
          const { data: completedData } = await supabase
            .from("progress")
            .select("id")
            .eq("student_id", currentUserId)
            .eq("completed", true)
            .in("lecture_id", lectureIds);

          completedLectures = completedData?.length || 0;
        }

        // Step 4 — percentage
        const percentage =
          totalLectures > 0
            ? Math.round((completedLectures / totalLectures) * 100)
            : 0;

        return {
          id: c.id || enrollment.course_id,
          title: c.title || "Physics Course",
          thumbnail_url: c.thumbnail_url || "/images/physics_course.png",
          enrolled_at: enrollment.enrolled_at
            ? new Date(enrollment.enrolled_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
          total_lectures: totalLectures,
          completed_lectures: completedLectures,
          progress_percent: percentage,
          // For sorting — use enrolled_at as proxy (progress sort handled separately)
          enrolled_at_ts: new Date(enrollment.enrolled_at || 0).getTime(),
        };
      });

      enrolledCoursesList = await Promise.all(courseStatsPromises);

      // ── 3. Overall metric card totals (sum across all courses) ────────
      for (const course of enrolledCoursesList) {
        totalLecturesCount += course.total_lectures;
        completedLecturesCount += course.completed_lectures;
      }
      overallProgressPercent =
        totalLecturesCount > 0
          ? Math.round((completedLecturesCount / totalLecturesCount) * 100)
          : 0;

      // ── 4. Sort courses — most recently enrolled first ─────────────────
      enrolledCoursesList.sort((a, b) => b.enrolled_at_ts - a.enrolled_at_ts);

      // ── 5. Recently watched lectures (across all courses) ─────────────
      //       Collect all lecture IDs across enrolled courses for a progress query
      const allChapterIds: string[] = [];
      for (const enrollment of enrollmentsData) {
        const { data: chData } = await supabase
          .from("chapters")
          .select("id")
          .eq("course_id", enrollment.course_id);
        for (const ch of chData || []) {
          allChapterIds.push(ch.id);
        }
      }

      if (allChapterIds.length > 0) {
        const { data: allLecturesData } = await supabase
          .from("lectures")
          .select("id, chapter_id, title, duration_mins")
          .in("chapter_id", allChapterIds);

        const allLectureIds = (allLecturesData || []).map((l: any) => l.id);

        if (allLectureIds.length > 0) {
          // Build chapter → course map
          const chapterToCourse: Record<string, string> = {};
          for (const enrollment of enrollmentsData) {
            const { data: chData } = await supabase
              .from("chapters")
              .select("id")
              .eq("course_id", enrollment.course_id);
            for (const ch of chData || []) {
              chapterToCourse[ch.id] = enrollment.course_id;
            }
          }

          const lectureMap: Record<string, any> = {};
          for (const l of allLecturesData || []) {
            lectureMap[l.id] = l;
          }

          const { data: recentProgressData } = await supabase
            .from("progress")
            .select("lecture_id, completed, completed_at, updated_at")
            .eq("student_id", currentUserId)
            .in("lecture_id", allLectureIds)
            .order("updated_at", { ascending: false })
            .limit(5);

          recentLectures = (recentProgressData || []).map((p: any) => {
            const lec = lectureMap[p.lecture_id] || {};
            const resolvedCourseId = lec.chapter_id
              ? chapterToCourse[lec.chapter_id] || ""
              : "";
            return {
              id: p.lecture_id,
              title: lec.title || "Physics Lecture",
              course_id: resolvedCourseId,
              completed_at: p.completed_at
                ? new Date(p.completed_at).toLocaleDateString()
                : "Recently",
              duration_mins: lec.duration_mins || 45,
              completed: p.completed,
            };
          });
        }
      }
    }
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        {/* Welcome Header */}
        <div className="mb-10 fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>🎓 Student Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Welcome back, <span className="gradient-text">Student</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Track your physics learning progress, enrolled courses, and recently watched lectures.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Enrolled Courses */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Enrolled Courses
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {enrolledCoursesCount}
              </h2>
              <p className="text-xs text-blue-400 mt-1 font-medium">Active physics modules</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl font-bold">
              📚
            </div>
          </div>

          {/* Card 2: Overall Progress */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Overall Progress
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {overallProgressPercent}%
              </h2>
              <p className="text-xs text-emerald-400 mt-1 font-medium">
                {completedLecturesCount} of {totalLecturesCount} lectures completed
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold">
              📊
            </div>
          </div>

          {/* Card 3: Lectures Completed */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Lectures Watched
              </p>
              <h2 className="text-3xl font-black text-white mt-1">
                {completedLecturesCount}
              </h2>
              <p className="text-xs text-cyan-400 mt-1 font-medium">Completed video lessons</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-2xl font-bold">
              ✅
            </div>
          </div>
        </div>

        {/* Main Content Grid: Enrolled Courses & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Enrolled Courses List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📖</span> My Enrolled Courses
              </h2>
              <Link
                href="/courses"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Browse All Courses →
              </Link>
            </div>

            {enrolledCoursesList.length > 0 ? (
              <div className="space-y-4">
                {enrolledCoursesList.map((course) => (
                  <div
                    key={course.id}
                    className="glass p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all card-hover"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        {/* Course Thumbnail */}
                        <div className="relative w-20 h-20 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-white/10">
                          <Image
                            src={course.thumbnail_url || "/images/physics_course.png"}
                            alt={course.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg leading-snug">
                            {course.title}
                          </h3>
                          {/* Progress label: "X/Y lectures • Z%" */}
                          <p className="text-xs text-slate-400 mt-1">
                            {course.completed_lectures}/{course.total_lectures} lectures
                            {course.total_lectures > 0 && (
                              <span className="text-blue-400 font-bold ml-1.5">
                                &bull; {course.progress_percent}%
                              </span>
                            )}
                          </p>
                          {/* Enrollment date */}
                          <p className="text-[11px] text-emerald-400/80 mt-1 font-medium flex items-center gap-1">
                            <span>&#10003;</span>
                            <span>Enrolled on {course.enrolled_at}</span>
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/courses/${course.id}`}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all text-center self-start sm:self-center whitespace-nowrap flex items-center gap-1.5"
                      >
                        Continue Learning &#8594;
                      </Link>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium mb-1.5">
                        <span>Course Completion</span>
                        <span className="text-blue-400 font-bold">
                          {course.progress_percent}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            course.progress_percent === 100
                              ? "bg-gradient-to-r from-emerald-500 to-green-400"
                              : "bg-gradient-to-r from-blue-600 to-cyan-400"
                          }`}
                          style={{ width: `${course.progress_percent}%` }}
                        />
                      </div>
                      {course.progress_percent === 100 && (
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                          🎉 Course completed!
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-2xl border border-white/10">
                <span className="text-5xl block mb-4">📚</span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  You haven&apos;t enrolled in any courses yet
                </h3>
                <p className="text-slate-400 mb-4">
                  Browse the course catalogue and enroll for free to start learning.
                </p>
                <Link
                  href="/courses"
                  className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
                >
                  Browse Courses →
                </Link>
              </div>
            )}
          </div>

          {/* Right Col: Recently Watched Lectures */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⏱️</span> Recently Watched
            </h2>

            {recentLectures.length > 0 ? (
              <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
                {recentLectures.map((lec) => (
                  <Link
                    key={lec.id}
                    href={`/courses/${lec.course_id}/lecture/${lec.id}`}
                    className="group block p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {lec.title}
                      </h4>
                      {lec.completed && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                          Done
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
                      <span>⏱️ {lec.duration_mins} mins</span>
                      <span>{lec.completed_at}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass p-6 rounded-2xl border border-white/10 text-center">
                <span className="text-4xl block mb-3">⏱️</span>
                <p className="text-slate-400">No lectures watched yet</p>
                <p className="text-xs text-slate-500 mt-1">Start a course to see your progress here</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}