import { Pencil, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeleteLectureButton from "@/components/ui/DeleteLectureButton";
import Navbar from "@/components/ui/Navbar";
import { TEACHER_EMAIL } from "@/lib/constants";
import type { Lecture } from "@/lib/database.types";

interface CoursePageProps {
  params: {
    id: string;
  };
}

export default async function TeacherCoursePage({ params }: CoursePageProps) {
  const { id } = params;
  const supabase = await createClient();

  // 1. Protection: Only teacher can view this page.
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user || user.email !== TEACHER_EMAIL) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">🔒</span>
            <h1 className="text-2xl font-bold text-white mb-2">Unauthorized</h1>
            <p className="text-slate-400 mb-6">This page is for teachers only.</p>
            <Link
              href="/teacher/dashboard"
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Return to Dashboard →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 2. Fetch course and lectures.
  let course: any = null;
  let lectures: Lecture[] = [];

  try {
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (courseData) {
      course = courseData;
    }

    const { data: lecturesData } = await supabase
      .from("lectures")
      .select("*")
      .eq("course_id", id)
      .order("order_number", { ascending: true });

    if (lecturesData && lecturesData.length > 0) {
      lectures = lecturesData as Lecture[];
    }
  } catch (err: unknown) {
    console.error("Error loading course:", err);
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <Link
            href="/teacher/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
          >
            ← Back to Teacher Dashboard
          </Link>
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">📚</span>
            <h1 className="text-2xl font-bold text-white mb-2">Course not found</h1>
            <p className="text-slate-400 mb-6">The course was deleted or doesn&apos;t exist.</p>
            <Link
              href="/teacher/dashboard"
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        {/* Back navigation */}
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          ← Back to Teacher Dashboard
        </Link>

        {/* Back to student view link */}
        <Link
          href={`/courses/${id}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-8"
        >
          ← View as Student
        </Link>

        {/* Course Banner */}
        <div className="glass p-8 rounded-3xl border border-white/10 mb-12 flex flex-col md:flex-row gap-8 items-center">
          <div className="relative w-full md:w-80 h-48 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0">
            <img
              src={course.thumbnail_url || "/images/physics_course.png"}
              alt={course.title || "Physics Course"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-blue-500/30">
              Physics Specialization
            </span>
            <h1 className="text-3xl font-extrabold text-white mb-3">{course.title}</h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{course.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span>📚</span> {lectures.length} Lectures
              </span>
              <span>•</span>
              <span>JEE & NEET Pattern</span>
            </div>
          </div>
        </div>

        {/* Actions Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Lectures</h2>
            <p className="text-slate-400 text-sm mt-1">
              Edit or delete lectures in this course
            </p>
          </div>
          <Link
            href="/teacher/lectures/new"
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm btn-glow transition-all flex items-center gap-2"
          >
            <span>＋</span> Add Lecture
          </Link>
        </div>

        {/* Lectures List */}
        {lectures.length > 0 ? (
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                className="glass p-5 rounded-2xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-hover"
              >
                {/* Left: Thumbnail & Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-indigo-400 ml-1" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Lecture #{lecture.order_number}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ⏱️ {lecture.duration_mins || 45} mins
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base">{lecture.title}</h3>
                    {lecture.description && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">
                        {lecture.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Edit & Delete Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/teacher/lectures/${lecture.id}/edit`}
                    aria-label={`Edit lecture ${lecture.title}`}
                    title="Edit lecture"
                    className="w-9 h-9 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteLectureButton
                    lectureId={lecture.id}
                    lectureTitle={lecture.title}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">📹</span>
            <h2 className="text-xl font-bold text-white mb-2">No lectures yet</h2>
            <p className="text-slate-400 mb-6">Add your first lecture to this course.</p>
            <Link
              href="/teacher/lectures/new"
              className="inline-block px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
            >
              ＋ Add Lecture
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}