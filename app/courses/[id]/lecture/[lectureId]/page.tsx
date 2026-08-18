"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import { createClient } from "@/lib/supabase/client";
import type { Lecture, Progress, LectureMaterial } from "@/lib/database.types";
import { FileText, Download, Paperclip } from "lucide-react";

interface LecturePageProps {
  params: {
    id: string;
    lectureId: string;
  };
}

// Convert various YouTube URL formats to standard embed URL
function getYouTubeEmbedUrl(url: string | null | undefined): string {
  if (!url) return "https://www.youtube.com/embed/dQw4w9WgXcQ";

  try {
    if (url.includes("embed/")) return url;

    // Handle youtube.com/watch?v=VIDEO_ID
    if (url.includes("watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Handle youtu.be/VIDEO_ID
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
  }

  return "https://www.youtube.com/embed/dQw4w9WgXcQ";
}

export default function LectureDetailPage({ params }: LecturePageProps) {
  const { id: courseIdParam, lectureId } = params;

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<string>(courseIdParam);
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setMaterialsLoading(true);

      try {
        // Get logged in user
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || null;
        setUserId(currentUserId);

        // Fetch lecture details by lectureId
        const { data: lectureData, error } = await supabase
          .from("lectures")
          .select("*")
          .eq("id", lectureId)
          .single();

        if (!error && lectureData) {
          const lec = lectureData as Lecture;
          setLecture(lec);

          let targetCourseId = lec.course_id || courseIdParam;

          // If chapter_id is present, fetch chapter details for breadcrumb and course_id fallback
          if (lec.chapter_id) {
            const { data: chapterData } = await supabase
              .from("chapters")
              .select("id, title, course_id")
              .eq("id", lec.chapter_id)
              .single();

            if (chapterData) {
              setChapterTitle(chapterData.title);
              if (chapterData.course_id) {
                targetCourseId = chapterData.course_id;
              }
            }
          }

          setResolvedCourseId(targetCourseId);
        } else {
          setLecture(null);
        }

        // Fetch study materials for this lecture
        const { data: materialsData } = await supabase
          .from("lecture_materials")
          .select("*")
          .eq("lecture_id", lectureId)
          .order("uploaded_at", { ascending: false });

        if (materialsData) {
          setMaterials(materialsData as LectureMaterial[]);
        }

        // Check completion status in progress table if logged in
        if (currentUserId) {
          const { data: progressData } = await supabase
            .from("progress")
            .select("*")
            .eq("student_id", currentUserId)
            .eq("lecture_id", lectureId)
            .maybeSingle();

          const progressRecord = progressData as Progress | null;
          if (progressRecord && progressRecord.completed) {
            setIsCompleted(true);
          }
        }
      } catch (err) {
        console.error("Error loading lecture details:", err);
      } finally {
        setLoading(false);
        setMaterialsLoading(false);
      }
    }

    loadData();
  }, [courseIdParam, lectureId, supabase]);

  const handleToggleComplete = async () => {
    setUpdatingProgress(true);
    setStatusMessage(null);

    const nextState = !isCompleted;

    try {
      if (userId) {
        // Upsert into Supabase progress table
        const progressPayload = {
          student_id: userId,
          lecture_id: lectureId,
          completed: nextState,
          completed_at: nextState ? new Date().toISOString() : null,
        };

        const { error } = await (supabase.from("progress") as any).upsert(
          progressPayload,
          { onConflict: "student_id,lecture_id" }
        );

        if (error) {
          console.error("Failed to update progress:", error);
        }
      }

      setIsCompleted(nextState);
      setStatusMessage(
        nextState ? "Lecture marked as completed! 🎉" : "Lecture marked as incomplete."
      );
    } catch (err) {
      console.error("Progress update error:", err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const embedUrl = getYouTubeEmbedUrl(lecture?.youtube_url);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        {/* Back Link */}
        <Link
          href={`/courses/${resolvedCourseId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          ← Back to Course Lectures
        </Link>

        {loading ? (
          <div className="glass p-12 rounded-3xl text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading lecture video...
          </div>
        ) : lecture ? (
          <div className="space-y-6">
            {/* Video Player Container */}
            <div className="glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={embedUrl}
                  title={lecture.title || "Lecture Video"}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Lecture Metadata & Actions below video */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {chapterTitle && (
                        <span className="bg-emerald-600/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                          📂 {chapterTitle}
                        </span>
                      )}
                      <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30">
                        Lecture #{lecture.order_number || 1}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ⏱️ {lecture.duration_mins || 45} minutes
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                      {lecture.title}
                    </h1>
                  </div>

                  {/* Mark as Complete Button */}
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <button
                      id="mark-complete-btn"
                      onClick={handleToggleComplete}
                      disabled={updatingProgress}
                      className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                        isCompleted
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                          : "bg-blue-600 hover:bg-blue-500 text-white btn-glow"
                      } disabled:opacity-50`}
                    >
                      {updatingProgress ? (
                        <span>Updating...</span>
                      ) : isCompleted ? (
                        <>
                          <span>✓ Completed</span>
                        </>
                      ) : (
                        <>
                          <span>Mark as Complete</span>
                        </>
                      )}
                    </button>

                    {statusMessage && (
                      <span className="text-xs text-emerald-400 font-medium fade-up">
                        {statusMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Lecture Description
                  </h3>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {lecture.description ||
                      "No detailed description provided for this lecture."}
                  </p>
                </div>
              </div>
            </div>

            {/* Study Materials Section */}
            <div className="glass p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl fade-up">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
                <Paperclip className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-extrabold text-white">Study Materials</h2>
                {materials.length > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30 ml-auto">
                    {materials.length} PDF{materials.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {materialsLoading ? (
                <div className="py-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  <span>Loading study materials...</span>
                </div>
              ) : materials.length === 0 ? (
                <div className="py-6 px-4 text-center text-slate-400 text-sm italic glass rounded-2xl border border-white/5 bg-white/[0.01]">
                  No study materials available for this lecture yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-2xl glass border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate" title={mat.title}>
                            {mat.title}
                          </h3>
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase inline-block mt-0.5">
                            PDF Document
                          </span>
                        </div>
                      </div>

                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 btn-glow flex-shrink-0"
                      >
                        <span>Download</span>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href={`/courses/${resolvedCourseId}`}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold transition-all"
              >
                ← Course Overview
              </Link>
              <Link
                href={`/courses/${resolvedCourseId}`}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold transition-all"
              >
                Next Lecture →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <span className="text-5xl block mb-4">📹</span>
            <h1 className="text-2xl font-bold text-white mb-2">Lecture not found</h1>
            <p className="text-slate-400 mb-6">The lecture you&apos;re looking for doesn&apos;t exist or isn&apos;t available.</p>
            <Link
              href={`/courses/${resolvedCourseId}`}
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              Back to Course
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