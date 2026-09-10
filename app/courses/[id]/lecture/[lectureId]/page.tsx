"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lecture, Progress, LectureMaterial } from "@/lib/database.types";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Download,
  Paperclip,
  MoreVertical,
  Share2,
  Clock,
  BookOpen,
  Sparkles,
  Maximize,
  ChevronLeft
} from "lucide-react";

interface LecturePageProps {
  params: {
    id: string;
    lectureId: string;
  };
}

// Convert various YouTube URL formats to standard embed URL with parameters
function getYouTubeEmbedUrl(url: string | null | undefined): string {
  if (!url) return "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1";

  try {
    let videoId = "";
    if (url.includes("embed/")) {
      const parts = url.split("embed/")[1]?.split("?")[0];
      videoId = parts || "";
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`;
    }
  } catch {
    // Fallback if parsing fails
  }

  return "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1";
}

export default function LectureDetailPage({ params }: LecturePageProps) {
  const { id: courseIdParam, lectureId } = params;
  const router = useRouter();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<string>(courseIdParam);
  const [materials, setMaterials] = useState<LectureMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const playerContainerRef = useRef<HTMLDivElement>(null);
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

          // Fetch chapter details if present to resolve subject, batch, or course breadcrumbs
          if (lec.chapter_id) {
            const { data: chapterData } = await supabase
              .from("chapters")
              .select("id, title, course_id, subject_id")
              .eq("id", lec.chapter_id)
              .single();

            if (chapterData) {
              setChapterTitle(chapterData.title);
              if (chapterData.subject_id) {
                setSubjectId(chapterData.subject_id);
                // Fetch subject to get batch_id
                const { data: subjectData } = await supabase
                  .from("subjects")
                  .select("id, batch_id")
                  .eq("id", chapterData.subject_id)
                  .single();

                if (subjectData?.batch_id) {
                  setBatchId(subjectData.batch_id);
                }
              }
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
          .order("created_at", { ascending: false });

        if (materialsData) {
          setMaterials(materialsData as LectureMaterial[]);
        }

        // Check completion status in progress table
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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setShowMenu(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Determine back navigation link
  const backHref =
    batchId && subjectId
      ? `/batches/${batchId}/subjects/${subjectId}`
      : `/courses/${resolvedCourseId}`;

  const embedUrl = getYouTubeEmbedUrl(lecture?.youtube_url);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* ── TOP INTEGRATED NAVIGATION OVERLAY BAR ────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Back Button & Context */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 flex-shrink-0 group"
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {chapterTitle && (
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider truncate max-w-[200px]">
                  {chapterTitle}
                </span>
              )}
              {lecture && (
                <span className="text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  Lec #{lecture.order_number || 1}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {loading ? "Loading lecture..." : lecture?.title || "Lecture Video"}
            </h1>
          </div>
        </div>

        {/* Right: Quick Actions & 3-Dot Options Menu */}
        <div className="flex items-center gap-2 flex-shrink-0 relative">
          {/* Quick Mark Complete */}
          <button
            onClick={handleToggleComplete}
            disabled={updatingProgress || loading}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <span>Mark Complete</span>
              </>
            )}
          </button>

          {/* 3-Dot Options Menu Toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl glass border border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-2 z-50 fade-up space-y-1">
              <button
                onClick={handleToggleComplete}
                className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{isCompleted ? "Mark as Incomplete" : "Mark as Completed"}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>{copiedLink ? "Link Copied!" : "Share Lecture Link"}</span>
              </button>

              <button
                onClick={() => {
                  handleToggleFullscreen();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <Maximize className="w-4 h-4 text-cyan-400" />
                <span>Full Screen View</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── IMMERSIVE FULL-WIDTH PLAYER CONTAINER ───────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-6 space-y-8">
        <div
          ref={playerContainerRef}
          className="relative w-full bg-black sm:rounded-3xl overflow-hidden border-y sm:border border-white/10 shadow-2xl shadow-blue-950/30 group"
        >
          {loading ? (
            <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/80">
              <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mb-4" />
              <p className="text-sm font-medium text-slate-300">Preparing high quality video player...</p>
            </div>
          ) : lecture ? (
            <div className="relative aspect-video w-full bg-black">
              {/* YouTube Embed iFrame */}
              <iframe
                src={embedUrl}
                title={lecture.title || "Lecture Video"}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* Decorative Subtle Overlay Frame gradient */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
              <span className="text-5xl block mb-4">📹</span>
              <h2 className="text-xl font-bold text-white mb-2">Lecture Video Unavailable</h2>
              <p className="text-slate-400 text-sm max-w-md mb-6">
                This lecture video could not be loaded or may have been removed.
              </p>
              <Link
                href={backHref}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
              >
                Back to Subject
              </Link>
            </div>
          )}
        </div>

        {/* ── BELOW VIDEO METADATA & STUDY MATERIALS ──────────────────── */}
        {lecture && (
          <div className="px-4 sm:px-0 space-y-8 fade-up pb-16">
            {/* Header info & Action Row */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {chapterTitle && (
                      <span className="bg-cyan-500/10 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/20">
                        {chapterTitle}
                      </span>
                    )}
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
                      Lecture #{lecture.order_number || 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {lecture.duration_mins || 45} mins
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {lecture.title}
                  </h1>
                </div>

                {/* Mark as Complete Main Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
                  <button
                    onClick={handleToggleComplete}
                    disabled={updatingProgress}
                    className={`px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg ${
                      isCompleted
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                        : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-950/50 btn-glow"
                    } disabled:opacity-50`}
                  >
                    {updatingProgress ? (
                      <span className="animate-pulse">Saving status...</span>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Lecture Completed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white/80" />
                        <span>Mark as Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 fade-up">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Lecture Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  About This Lecture
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {lecture.description || "No detailed description provided for this lecture video."}
                </p>
              </div>
            </div>

            {/* Study Materials Section */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">Study Materials</h2>
                    <p className="text-slate-400 text-xs">PDF notes, practice sheets, and formula guides</p>
                  </div>
                </div>

                {materials.length > 0 && (
                  <span className="text-xs bg-emerald-500/15 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                    {materials.length} {materials.length === 1 ? "File" : "Files"}
                  </span>
                )}
              </div>

              {materialsLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                  <span>Loading attached documents...</span>
                </div>
              ) : materials.length === 0 ? (
                <div className="py-8 px-4 text-center text-slate-400 text-xs rounded-2xl border border-white/5 bg-white/[0.01]">
                  No study materials attached to this lecture yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materials.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-2xl glass border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/40 flex items-center justify-between gap-4 transition-all duration-300"
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
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-emerald-950/50 flex-shrink-0"
                      >
                        <span>Download</span>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={backHref}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Subject</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}