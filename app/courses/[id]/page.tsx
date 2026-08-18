import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import StudentCourseAccordion from "@/components/student/StudentCourseAccordion";
import EnrollButton from "./EnrollButton";
import { createClient } from "@/lib/supabase/server";
import type { Course, Chapter, Lecture } from "@/lib/database.types";

interface CoursePageProps {
  params: {
    id: string;
  };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { id } = params;
  let course: Course | null = null;
  let chapters: Chapter[] = [];
  let lectures: Lecture[] = [];
  let completedLectureIds: string[] = [];
  let isEnrolled = false;
  let isLoggedIn = false;

  try {
    const supabase = await createClient();

    // 1. Fetch course details
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (courseData) {
      course = courseData as Course;
    }

    // 2. Fetch chapters for this course ordered by order_number
    const { data: chaptersData } = await supabase
      .from("chapters")
      .select("*")
      .eq("course_id", id)
      .order("order_number", { ascending: true });

    if (chaptersData) {
      chapters = chaptersData as Chapter[];
    }

    // 3. Fetch lectures for this course (by chapter_id or fallback course_id)
    if (chapters.length > 0) {
      const chapterIds = chapters.map((ch) => ch.id);
      const { data: lecturesData } = await supabase
        .from("lectures")
        .select("*")
        .in("chapter_id", chapterIds)
        .order("order_number", { ascending: true });

      if (lecturesData) {
        lectures = lecturesData as Lecture[];
      }
    } else {
      const { data: lecturesData } = await supabase
        .from("lectures")
        .select("*")
        .eq("course_id", id)
        .order("order_number", { ascending: true });

      if (lecturesData) {
        lectures = lecturesData as Lecture[];
      }
    }

    // 4. Check auth & enrollment status
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    isLoggedIn = !!user;

    if (user) {
      // Check if this student is already enrolled
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", id)
        .maybeSingle();

      isEnrolled = !!enrollmentData;

      // 5. Fetch completed lectures progress (only if enrolled)
      if (isEnrolled && lectures.length > 0) {
        const lectureIds = lectures.map((l) => l.id);
        const { data: progressData } = await supabase
          .from("progress")
          .select("lecture_id")
          .eq("student_id", user.id)
          .eq("completed", true)
          .in("lecture_id", lectureIds);

        if (progressData) {
          completedLectureIds = progressData.map((p) => p.lecture_id);
        }
      }
    }
  } catch (err) {
    console.error("Error fetching course detail data:", err);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">📚</span>
            <h1 className="text-2xl font-bold text-white mb-2">Course not found</h1>
            <p className="text-slate-400 mb-6">
              The course you&apos;re looking for doesn&apos;t exist or isn&apos;t published yet.
            </p>
            <Link
              href="/courses"
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Browse All Courses →
            </Link>
          </div>
        </main>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        {/* Back Link */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          ← Back to All Courses
        </Link>

        {/* Course Banner */}
        <div className="glass p-8 rounded-3xl border border-white/10 mb-12 flex flex-col md:flex-row gap-8 items-center fade-up">
          <div className="relative w-full md:w-80 h-48 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0">
            <Image
              src={course.thumbnail_url || "/images/physics_course.png"}
              alt={course.title || "Physics Course"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-blue-500/30">
              Physics Specialization
            </span>
            <h1 className="text-3xl font-extrabold text-white mb-3">
              {course.title}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {course.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap mb-5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span>📂</span> {chapters.length} Chapters
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <span>📹</span> {lectures.length} Lectures
              </span>
              <span>•</span>
              <span>JEE &amp; NEET Pattern</span>

              {/* Enrolled badge shown inside the banner */}
              {isEnrolled && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30 text-xs">
                    ✓ Enrolled
                  </span>
                </>
              )}
            </div>

            {/* ── Overall Course Progress Bar (enrolled students only) ── */}
            {isEnrolled && lectures.length > 0 && (() => {
              const pct = Math.round((completedLectureIds.length / lectures.length) * 100);
              return (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-300">Course Progress</span>
                    <span className="text-blue-400">
                      {completedLectureIds.length}/{lectures.length} lectures &bull; {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct === 100 && (
                    <p className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                      🎉 Course completed!
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Enroll CTA (shown only when NOT enrolled) ─────────────── */}
        {!isEnrolled && (
          <div className="glass border border-emerald-500/30 rounded-3xl p-8 mb-10 text-center fade-up">
            <span className="text-4xl block mb-3">🎓</span>
            <h2 className="text-xl font-extrabold text-white mb-2">
              Enroll to Access Full Course Content
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              This course is completely <span className="text-emerald-400 font-semibold">free</span>. Enroll now to unlock all{" "}
              {lectures.length} lectures and start learning today.
            </p>

            {isLoggedIn ? (
              <EnrollButton courseId={id} />
            ) : (
              <Link
                href={`/login?redirect=/courses/${id}`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-lg transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
              >
                🔒 Login to Enroll — Free
              </Link>
            )}
          </div>
        )}

        {/* Course Syllabus Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Course Syllabus &amp; Chapters</h2>
            <p className="text-slate-400 text-sm mt-1">
              {isEnrolled
                ? "Select a lecture to start watching"
                : "Enroll above to unlock all lectures"}
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3.5 py-1.5 rounded-xl border border-white/10 font-mono">
            {lectures.length} Total Lessons
          </span>
        </div>

        {/* Accordion Component with Chapters and Lectures */}
        {isEnrolled ? (
          <StudentCourseAccordion
            courseId={id}
            chapters={chapters}
            lectures={lectures}
            completedLectureIds={completedLectureIds}
          />
        ) : (
          /* Locked preview — blurred chapter list teaser */
          <div className="space-y-3 relative">
            {/* Gradient overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950 rounded-3xl pointer-events-none" />

            {/* Blurred chapter skeletons */}
            {(chapters.length > 0 ? chapters : [{ id: "preview-1", title: "Chapter 1", order_number: 1 }, { id: "preview-2", title: "Chapter 2", order_number: 2 }] as any[]).slice(0, 4).map((ch: any, i: number) => (
              <div
                key={ch.id || i}
                className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between select-none blur-[2px]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    #{ch.order_number || i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{ch.title || `Chapter ${i + 1}`}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lectures.filter((l) => l.chapter_id === ch.id).length || "—"} lectures
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-white/10">
                  🔒 Locked
                </span>
              </div>
            ))}

            {/* CTA on top of blur */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-4">
              <p className="text-slate-400 text-sm font-medium bg-slate-950/80 px-5 py-2 rounded-full border border-white/10">
                🔒 Enroll above to unlock all chapters &amp; lectures
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}