"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lecture, Progress } from "@/lib/database.types";
import {
  CheckCircle2,
  Share2,
  Sparkles,
  ChevronLeft,
  PlayCircle,
  Clock,
  BookOpen,
  Lock,
  RotateCw,
  Minimize,
} from "lucide-react";

interface LecturePageProps {
  params: { lectureId: string };
}

function getYouTubeEmbedUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    let videoId = "";
    if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0] || "";
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&controls=1&autoplay=1&enablejsapi=1`;
    }
  } catch {
    // fallback
  }
  return "";
}

function getYouTubeThumbnail(url: string | null | undefined): string {
  if (!url) return "";
  try {
    let videoId = "";
    if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0] || "";
    else if (url.includes("watch?v=")) videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  } catch { /* */ }
  return "";
}

export default function LecturePage({ params }: LecturePageProps) {
  const { lectureId } = params;
  const router = useRouter();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [siblingLectures, setSiblingLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const toggleFullscreenRotate = async () => {
    const el = videoContainerRef.current;
    if (!el) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = document as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elem = el as any;

    const isCurrentlyFS = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentlyFS) {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }

      if (typeof window !== "undefined" && window.screen && window.screen.orientation) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orientation = window.screen.orientation as any;
          if (orientation.lock) {
            await orientation.lock("landscape").catch(() => {});
          }
        } catch {
          // Ignore
        }
      }
      setIsFullscreen(true);
    } else {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }

      if (typeof window !== "undefined" && window.screen && window.screen.orientation) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orientation = window.screen.orientation as any;
          if (orientation.unlock) {
            orientation.unlock();
          }
        } catch {
          // Ignore
        }
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = document as any;
      const isFS = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFS);

      if (!isFS && typeof window !== "undefined" && window.screen?.orientation) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window.screen.orientation as any).unlock?.();
        } catch { /* */ }
      }
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    document.addEventListener("webkitfullscreenchange", handleFSChange);
    document.addEventListener("mozfullscreenchange", handleFSChange);
    document.addEventListener("MSFullscreenChange", handleFSChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      document.removeEventListener("webkitfullscreenchange", handleFSChange);
      document.removeEventListener("mozfullscreenchange", handleFSChange);
      document.removeEventListener("MSFullscreenChange", handleFSChange);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Auth
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || null;
        setUserId(currentUserId);

        // 2. Fetch current lecture
        const { data: lectureData, error } = await supabase
          .from("lectures")
          .select("*")
          .eq("id", lectureId)
          .single();

        if (!error && lectureData) {
          setLecture(lectureData as Lecture);

          // 3. Chapter → subject → batch chain
          if (lectureData.chapter_id) {
            setChapterId(lectureData.chapter_id);
            const { data: chapterData } = await supabase
              .from("chapters")
              .select("id, title, subject_id")
              .eq("id", lectureData.chapter_id)
              .single();

            if (chapterData) {
              setChapterTitle(chapterData.title);
              if (chapterData.subject_id) {
                setSubjectId(chapterData.subject_id);
                const { data: subjectData } = await supabase
                  .from("subjects")
                  .select("id, batch_id")
                  .eq("id", chapterData.subject_id)
                  .single();
                if (subjectData?.batch_id) setBatchId(subjectData.batch_id);

                // 4. Fetch all lectures in same chapter
                const { data: siblingsData } = await supabase
                  .from("lectures")
                  .select("*")
                  .eq("chapter_id", lectureData.chapter_id)
                  .order("order_number", { ascending: true });

                if (siblingsData) setSiblingLectures(siblingsData as Lecture[]);
              }
            }
          }
        } else {
          setLecture(null);
        }

        // 5. Completion status
        if (currentUserId) {
          const { data: progressData } = await supabase
            .from("progress")
            .select("lecture_id, completed")
            .eq("student_id", currentUserId);

          if (progressData) {
            const ids = new Set<string>(
              (progressData as { lecture_id: string; completed: boolean }[])
                .filter((p) => p.completed)
                .map((p) => p.lecture_id)
            );
            setCompletedIds(ids);
            if (ids.has(lectureId)) setIsCompleted(true);
          }
        }
      } catch (err) {
        console.error("Error loading lecture:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  const handleToggleComplete = async () => {
    setUpdatingProgress(true);
    setStatusMessage(null);
    const nextState = !isCompleted;
    try {
      if (userId) {
        const payload = {
          student_id: userId,
          lecture_id: lectureId,
          completed: nextState,
          completed_at: nextState ? new Date().toISOString() : null,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("progress") as any).upsert(payload, {
          onConflict: "student_id,lecture_id",
        });
      }
      setIsCompleted(nextState);
      setCompletedIds((prev) => {
        const next = new Set(prev);
        nextState ? next.add(lectureId) : next.delete(lectureId);
        return next;
      });
      setStatusMessage(nextState ? "Lecture completed! 🎉" : "Marked as incomplete.");
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
    }
  };

  const backHref =
    batchId && subjectId
      ? `/batches/${batchId}/subjects/${subjectId}`
      : "/student/my-batches";

  const embedUrl = getYouTubeEmbedUrl(lecture?.youtube_url);

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-slate-100 flex flex-col">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 w-full bg-[#0d0d0f]/95 backdrop-blur-xl border-b border-white/[0.07] px-3 sm:px-6 py-3 flex items-center gap-3">
        <Link
          href={backHref}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all flex-shrink-0 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {chapterTitle && (
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest hidden sm:inline">
                {chapterTitle}
              </span>
            )}
            {chapterTitle && <span className="text-white/20 hidden sm:inline text-xs">›</span>}
            <h1 className="text-sm font-semibold text-white truncate max-w-[260px] sm:max-w-lg">
              {loading ? "Loading..." : lecture?.title || "Lecture"}
            </h1>
            {lecture && (
              <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 hidden sm:inline">
                Lec {lecture.order_number || 1}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleComplete}
            disabled={updatingProgress || loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              isCompleted
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-900/30"
            } disabled:opacity-50`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCompleted ? "Completed" : "Mark Done"}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* LEFT: Video player area */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Video player container */}
          <div className="w-full bg-black">
            {loading ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center bg-[#111113]">
                <div className="w-12 h-12 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400 font-medium">Loading video...</p>
              </div>
            ) : lecture && embedUrl ? (
              <div ref={videoContainerRef} className="relative aspect-video w-full bg-black group overflow-hidden">
                <iframe
                  src={embedUrl}
                  title={lecture.title || "Lecture Video"}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; orientation-lock"
                  allowFullScreen
                />
                {/* Mobile Rotate / Fullscreen Button */}
                <button
                  onClick={toggleFullscreenRotate}
                  type="button"
                  className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
                  title="Rotate Fullscreen"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-3.5 h-3.5 text-orange-400" />
                      <span>Exit Fullscreen</span>
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-3.5 h-3.5 text-orange-400" />
                      <span>Rotate Fullscreen</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center bg-[#111113] p-8 text-center">
                <span className="text-5xl mb-4">📹</span>
                <h2 className="text-lg font-bold text-white mb-2">Video Unavailable</h2>
                <p className="text-slate-400 text-sm mb-5">This lecture could not be loaded.</p>
                <Link href={backHref} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all">
                  Go Back
                </Link>
              </div>
            )}
          </div>

          {/* Below video: lecture info */}
          {!loading && lecture && (
            <div className="px-4 sm:px-6 py-5 border-b border-white/[0.07] space-y-3">
              {/* Tags row */}
              <div className="flex items-center gap-2 flex-wrap">
                {chapterTitle && (
                  <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-md border border-orange-500/20 uppercase tracking-wider">
                    {chapterTitle}
                  </span>
                )}
                <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                  Lecture {lecture.order_number || 1}
                </span>
                {lecture.duration_mins && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lecture.duration_mins} min
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {lecture.title}
              </h2>

              {/* Description */}
              {lecture.description && (
                <p className="text-slate-400 text-sm leading-relaxed">{lecture.description}</p>
              )}

              {/* Status toast */}
              {statusMessage && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Lecture List */}
        <div className="lg:w-[360px] xl:w-[400px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.07] flex flex-col bg-[#0f0f12]">
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-white">
              {chapterTitle || "Lectures"}
            </span>
            {siblingLectures.length > 0 && (
              <span className="ml-auto text-[11px] text-slate-500 font-medium">
                {siblingLectures.length} videos
              </span>
            )}
          </div>

          {/* Lecture list */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-60px)]">
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : siblingLectures.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-500 text-sm">
                No other lectures in this chapter.
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {siblingLectures.map((lec) => {
                  const isCurrent = lec.id === lectureId;
                  const isDone = completedIds.has(lec.id);
                  const thumb = lec.thumbnail_url || getYouTubeThumbnail(lec.youtube_url);

                  return (
                    <Link
                      key={lec.id}
                      href={`/lecture/${lec.id}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                        isCurrent
                          ? "bg-orange-500/15 border border-orange-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={lec.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <PlayCircle className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        {/* Play overlay */}
                        {isCurrent ? (
                          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-white ml-0.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <PlayCircle className="w-6 h-6 text-white" />
                          </div>
                        )}
                        {/* Done badge */}
                        {isDone && !isCurrent && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight truncate ${isCurrent ? "text-orange-300" : "text-slate-200 group-hover:text-white"} transition-colors`}>
                          {lec.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-medium ${isCurrent ? "text-orange-400" : "text-slate-500"}`}>
                            Lec {lec.order_number || 1}
                          </span>
                          {lec.duration_mins && (
                            <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {lec.duration_mins}m
                            </span>
                          )}
                          {isDone && (
                            <span className="text-[10px] text-emerald-500 font-bold">✓ Done</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
