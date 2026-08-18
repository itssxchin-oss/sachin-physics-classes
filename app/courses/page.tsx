import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/database.types";

export default async function CoursesPage() {
  let courses: Course[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      courses = data as Course[];
    }
  } catch {
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
          <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-500/30 uppercase tracking-wider">
            ⚛️ Course Catalogue
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Explore All <span className="gradient-text">Physics Courses</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Structured modules designed by Sachin Sir to help you build solid concepts and score top marks in JEE & NEET.
          </p>
        </div>

        {/* Course Cards Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group glass rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/40 transition-all duration-300 flex flex-col card-hover"
              >
                {/* Thumbnail Image */}
                <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                  <Image
                    src={course.thumbnail_url || "/images/physics_course.png"}
                    alt={course.title || "Physics Course"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <span className="absolute top-3 right-3 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    Physics
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-3 line-clamp-1">
                      {course.title}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
                      {course.description || "Comprehensive physics lessons with detailed problem solving."}
                    </p>
                  </div>

                  {/* Footer action */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-blue-400">
                      <span>📖</span> View Curriculum
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform text-white font-bold">
                      Learn More →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">📚</span>
            <h2 className="text-xl font-bold text-white mb-2">No courses available yet</h2>
            <p className="text-slate-400">Check back soon for new physics courses from Sachin Sir.</p>
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