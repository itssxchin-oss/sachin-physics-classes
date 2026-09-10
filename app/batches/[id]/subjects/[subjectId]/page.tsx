import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import SubjectChaptersAccordion from "@/components/student/SubjectChaptersAccordion";
import type { Subject, Batch, Chapter, Lecture } from "@/lib/database.types";
import { BookOpen, ChevronRight, Layers } from "lucide-react";

interface SubjectDetailPageProps {
  params: {
    id: string;
    subjectId: string;
  };
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { id: batchId, subjectId } = params;
  const supabase = await createClient();

  // 1. Auth Guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Batch
  const { data: batchData } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (!batchData) {
    notFound();
  }

  const batch = batchData as Batch;

  // 3. Fetch Subject
  const { data: subjectData } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .eq("batch_id", batchId)
    .single();

  if (!subjectData) {
    notFound();
  }

  const subject = subjectData as Subject;

  // 4. Check Batch Enrollment
  const { data: enrollment } = await supabase
    .from("batch_enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("batch_id", batchId)
    .maybeSingle();

  if (!enrollment) {
    redirect(`/batches/${batchId}`);
  }

  // 5. Fetch Chapters for this Subject
  const { data: chaptersData } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .order("order_number", { ascending: true });

  const chapters = (chaptersData || []) as Chapter[];
  const chapterIds = chapters.map((c) => c.id);

  // 6. Fetch Lectures for these Chapters
  let lectures: Lecture[] = [];
  if (chapterIds.length > 0) {
    const { data: lecturesData } = await supabase
      .from("lectures")
      .select("*")
      .in("chapter_id", chapterIds)
      .order("order_number", { ascending: true });

    lectures = (lecturesData || []) as Lecture[];
  }

  // 7. Fetch Student Progress for these Lectures
  const lectureIds = lectures.map((l) => l.id);
  let completedLectureIds: string[] = [];

  if (lectureIds.length > 0) {
    const { data: progressData } = await supabase
      .from("progress")
      .select("lecture_id")
      .eq("student_id", user.id)
      .eq("completed", true)
      .in("lecture_id", lectureIds);

    if (progressData) {
      completedLectureIds = progressData.map((p: { lecture_id: string }) => p.lecture_id);
    }
  }

  return (
    <StudentSidebarLayout pageTitle={subject.title} backHref={`/batches/${batchId}`}>
      <div className="space-y-6 w-full max-w-7xl mx-auto min-w-0">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 overflow-x-auto pb-1">
          <Link href="/student/my-batches" className="hover:text-blue-400 transition-colors whitespace-nowrap">
            My Batches
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <Link href={`/batches/${batchId}`} className="hover:text-blue-400 transition-colors whitespace-nowrap truncate max-w-[150px] sm:max-w-[200px]">
            {batch.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <span className="text-white font-medium whitespace-nowrap truncate max-w-[150px] sm:max-w-[200px]">
            {subject.title}
          </span>
        </div>

        {/* Subject Hero Header */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden fade-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>Subject</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {subject.title}
              </h1>
              {subject.description && (
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                  {subject.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 text-center self-stretch sm:self-auto justify-around">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">{chapters.length}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chapters</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-blue-400">{lectures.length}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lectures</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters & Lectures Accordion */}
        <SubjectChaptersAccordion
          batchId={batchId}
          subjectTitle={subject.title}
          chapters={chapters}
          lectures={lectures}
          completedLectureIds={completedLectureIds}
        />
      </div>
    </StudentSidebarLayout>
  );
}
