import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import TeacherCourseAccordion from "@/components/teacher/TeacherCourseAccordion";
import { createClient } from "@/lib/supabase/server";
import { TEACHER_EMAIL } from "@/lib/constants";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // 1. Protection check: User must be authenticated.
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/login");
  }

  // 2. Protection check: Only the hardcoded teacher email may access this page.
  if (user.email !== TEACHER_EMAIL) {
    redirect("/courses");
  }

  // 3. Fetch metrics & hierarchy data from Supabase
  let totalStudentsCount = 0;
  let totalCoursesCount = 0;
  let totalLecturesCount = 0;
  let coursesList: any[] = [];
  let chaptersList: any[] = [];
  let lecturesList: any[] = [];

  try {
    // Count total students
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    if (studentCount !== null && studentCount !== undefined) {
      totalStudentsCount = studentCount;
    }

    // Fetch courses
    const { count: courseCount, data: coursesData } = await supabase
      .from("courses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (courseCount !== null && courseCount !== undefined) {
      totalCoursesCount = courseCount;
    }
    if (coursesData) {
      coursesList = coursesData;
    }

    // Fetch chapters
    const { data: chaptersData } = await supabase
      .from("chapters")
      .select("*")
      .order("order_number", { ascending: true });

    if (chaptersData) {
      chaptersList = chaptersData;
    }

    // Fetch lectures
    const { count: lectureCount, data: lecturesData } = await supabase
      .from("lectures")
      .select("*", { count: "exact" })
      .order("order_number", { ascending: true });

    if (lectureCount !== null && lectureCount !== undefined) {
      totalLecturesCount = lectureCount;
    }
    if (lecturesData) {
      lecturesList = lecturesData;
    }
  } catch (err) {
    console.error("Error loading teacher dashboard metrics:", err);
  }

  const successMessage =
    searchParams.success === "chapter-created"
      ? "Chapter created successfully."
      : searchParams.success === "course-created"
        ? "Course created successfully."
        : searchParams.success === "lecture-created"
          ? "Lecture created successfully."
          : searchParams.updated === "chapter"
            ? "Chapter updated successfully."
            : searchParams.updated === "lecture"
              ? "Lecture updated successfully."
              : searchParams.updated === "1"
                ? "Course updated successfully."
                : searchParams.deleted === "1"
                  ? "Course deleted successfully."
                  : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl glass border border-emerald-500/30 text-emerald-200 text-sm font-medium text-center fade-up">
            ✓ {successMessage}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 fade-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <span>🎓 Teacher Portal • Protected Route</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Teacher <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome, <span className="text-white font-semibold">{user.email}</span>. Manage your physics courses, chapters, and lectures.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/teacher/courses/new"
              id="add-course-btn"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm btn-glow transition-all flex items-center gap-1.5"
            >
              <span className="text-base">＋</span> Add Course
            </Link>
            <Link
              href="/teacher/chapters/new"
              id="add-chapter-btn"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm btn-glow transition-all flex items-center gap-1.5"
            >
              <span className="text-base">📂</span> Add Chapter
            </Link>
            <Link
              href="/teacher/lectures/new"
              id="add-lecture-btn"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm btn-glow transition-all flex items-center gap-1.5"
            >
              <span className="text-base">📹</span> Add Lecture
            </Link>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Metric 1: Total Students */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total Students
              </p>
              <h2 className="text-4xl font-black text-white mt-1">
                {totalStudentsCount}
              </h2>
              <p className="text-xs text-emerald-400 mt-1 font-medium">Enrolled learners</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold">
              👨‍🎓
            </div>
          </div>

          {/* Metric 2: Total Courses */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total Courses
              </p>
              <h2 className="text-4xl font-black text-white mt-1">
                {totalCoursesCount}
              </h2>
              <p className="text-xs text-blue-400 mt-1 font-medium">Physics modules published</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-2xl font-bold">
              📚
            </div>
          </div>

          {/* Metric 3: Total Lectures */}
          <div className="glass p-6 rounded-2xl border border-white/10 flex items-center justify-between card-hover">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total Lectures
              </p>
              <h2 className="text-4xl font-black text-white mt-1">
                {totalLecturesCount}
              </h2>
              <p className="text-xs text-indigo-400 mt-1 font-medium">Uploaded video lessons</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold">
              📹
            </div>
          </div>
        </div>

        {/* Management Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Courses & Chapter/Lecture Hierarchy Management (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚</span> Courses, Chapters & Lectures
              </h2>
              <Link
                href="/courses"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Public Catalogue →
              </Link>
            </div>

            {/* Expandable Course Accordion with Chapters and Nested Lectures */}
            <TeacherCourseAccordion
              courses={coursesList}
              chapters={chaptersList}
              lectures={lecturesList}
            />
          </div>

          {/* Quick Creator Control Panel (Right Col) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚡</span> Quick Management
            </h2>

            <div className="glass p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
                <h4 className="font-bold text-white text-sm mb-1">Create New Physics Course</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Add a new course title, description, and thumbnail to your student catalogue.
                </p>
                <Link
                  href="/teacher/courses/new"
                  className="inline-block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-center font-bold text-xs rounded-xl transition-all"
                >
                  ＋ Launch Course Creator
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-500/20">
                <h4 className="font-bold text-white text-sm mb-1">Create New Chapter</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Add a new chapter to group lectures inside a physics course.
                </p>
                <Link
                  href="/teacher/chapters/new"
                  className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold text-xs rounded-xl transition-all"
                >
                  📂 Launch Chapter Creator
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
                <h4 className="font-bold text-white text-sm mb-1">Upload New Lecture Video</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Add a YouTube video lesson link to a specific course & chapter.
                </p>
                <Link
                  href="/teacher/lectures/new"
                  className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-bold text-xs rounded-xl transition-all"
                >
                  📹 Upload Lecture Video
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sachin Physics Classes. All rights reserved.</p>
      </footer>
    </div>
  );
}