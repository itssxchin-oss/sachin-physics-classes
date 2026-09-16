import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudentSidebarLayout from "@/components/student/StudentSidebarLayout";
import PWThorChapterView from "@/components/student/PWThorChapterView";
import type { Subject, Batch, Chapter, Lecture, LectureMaterial } from "@/lib/database.types";
import { ChevronRight } from "lucide-react";

interface ChapterDetailPageProps {
  params: {
    id: string;
    subjectId: string;
    chapterId: string;
  };
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
  const { id: batchId, subjectId, chapterId } = params;
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

  // 4. Fetch Chapter
  const { data: chapterData } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .eq("subject_id", subjectId)
    .single();

  if (!chapterData) {
    notFound();
  }

  const chapter = chapterData as Chapter;

  // 5. Check Batch Enrollment
  const { data: enrollment } = await supabase
    .from("batch_enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("batch_id", batchId)
    .maybeSingle();

  if (!enrollment) {
    redirect(`/batches/${batchId}`);
  }

  // 6. Fetch Lectures for this Chapter
  const { data: lecturesData } = await supabase
    .from("lectures")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("order_number", { ascending: true });

  const lectures = (lecturesData || []) as Lecture[];
  const lectureIds = lectures.map((l) => l.id);

  // 7. Fetch Student Progress for these Lectures
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

  // 8. Fetch Materials (Notes, DPP PDF, DPP Video, DPP Quiz) for these lectures
  let materials: LectureMaterial[] = [];
  if (lectureIds.length > 0) {
    const { data: materialsData } = await supabase
      .from("lecture_materials")
      .select("*")
      .in("lecture_id", lectureIds);

    if (materialsData) {
      materials = materialsData as LectureMaterial[];
    }
  }

  return (
    <StudentSidebarLayout pageTitle={chapter.title} backHref={`/batches/${batchId}/subjects/${subjectId}`}>
      <div className="space-y-6 w-full max-w-7xl mx-auto min-w-0">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 overflow-x-auto pb-1">
          <Link href="/student/my-batches" className="hover:text-blue-400 transition-colors whitespace-nowrap">
            My Batches
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <Link href={`/batches/${batchId}`} className="hover:text-blue-400 transition-colors whitespace-nowrap truncate max-w-[140px]">
            {batch.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <Link href={`/batches/${batchId}/subjects/${subjectId}`} className="hover:text-blue-400 transition-colors whitespace-nowrap truncate max-w-[140px]">
            {subject.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
          <span className="text-white font-medium whitespace-nowrap truncate max-w-[160px]">
            {chapter.title}
          </span>
        </div>

        {/* PW Thor Style Chapter & Lecture View Component */}
        <PWThorChapterView
          batch={batch}
          subject={subject}
          chapter={chapter}
          lectures={lectures}
          completedLectureIds={completedLectureIds}
          materials={materials}
        />
      </div>
    </StudentSidebarLayout>
  );
}
