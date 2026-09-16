"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Check, Clock, FileText, HelpCircle, Download, Video, Sparkles, BookOpen } from "lucide-react";
import type { Batch, Subject, Chapter, Lecture, LectureMaterial } from "@/lib/database.types";

interface PWThorChapterViewProps {
  batch: Batch;
  subject: Subject;
  chapter: Chapter;
  lectures: Lecture[];
  completedLectureIds: string[];
  materials: LectureMaterial[];
}

type TabType = "lectures" | "notes" | "dpp_quiz" | "dpp_pdf" | "dpp_video";

export default function PWThorChapterView({
  batch,
  subject,
  chapter,
  lectures,
  completedLectureIds,
  materials,
}: PWThorChapterViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("lectures");
  const completedSet = new Set(completedLectureIds);

  // Helper to extract YouTube video ID for auto thumbnails
  const getYouTubeThumbnail = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
      }
    } catch {
      // ignore error
    }
    return null;
  };

  // Helper to format date like "17 Jun 2026"
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "24 Jun 2026";
    }
  };

  // Helper to format minutes to HH:MM:SS or MM:SS
  const formatDuration = (mins: number | null) => {
    const totalMins = mins || 45;
    const hrs = Math.floor(totalMins / 60);
    const remainingMins = totalMins % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(remainingMins).padStart(2, "0")}:00`;
    }
    return `00:${String(remainingMins).padStart(2, "0")}:00`;
  };

  // Filter materials by tab
  const notesMaterials = materials.filter(
    (m) => m.file_type === "notes" || m.file_type === "pdf"
  );
  const dppPdfMaterials = materials.filter((m) => m.file_type === "dpp_pdf");
  const dppVideoMaterials = materials.filter((m) => m.file_type === "dpp_video");
  const dppQuizMaterials = materials.filter((m) => m.file_type === "dpp_quiz");

  return (
    <div className="space-y-6 fade-up">
      {/* ── Top Header Title ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          {chapter.title}
        </h1>
        {chapter.description && (
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            {chapter.description}
          </p>
        )}
      </div>

      {/* ── PhysicsWallah (PW Thor) Style Tabs Bar ──────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#161922] border border-white/10 overflow-x-auto max-w-full touch-scroll" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <button
          type="button"
          onClick={() => setActiveTab("lectures")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === "lectures"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Lectures</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-extrabold">
            {lectures.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === "notes"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dpp_quiz")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === "dpp_quiz"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>DPP Quiz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dpp_pdf")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === "dpp_pdf"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>DPP PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dpp_video")}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
            activeTab === "dpp_video"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>DPP Video</span>
        </button>
      </div>

      {/* ── Tab Content: LECTURES ───────────────────────────────────── */}
      {activeTab === "lectures" && (
        <div>
          {lectures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {lectures.map((lecture) => {
                const isCompleted = completedSet.has(lecture.id);
                const customThumb = lecture.thumbnail_url;
                const ytThumb = getYouTubeThumbnail(lecture.youtube_url);
                const displayThumb = customThumb || ytThumb;

                return (
                  <Link
                    key={lecture.id}
                    href={`/lecture/${lecture.id}`}
                    className={`group rounded-2xl bg-[#0f121a] border overflow-hidden transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] ${
                      isCompleted
                        ? "border-blue-500/40 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-950/60"
                        : "border-slate-800 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-950/60"
                    }`}
                  >
                    {/* ── Top Poster Thumbnail Area ───────────────────── */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-white/10">
                      {displayThumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={displayThumb}
                          alt={lecture.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        /* PhysicsWallah PW Thor Style Graphic Card Poster Fallback */
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 text-slate-900 p-4 flex flex-col justify-between relative overflow-hidden">
                          <div className="space-y-1 relative z-10 max-w-[65%]">
                            <span className="text-[11px] font-extrabold text-blue-700 tracking-tight block">
                              {chapter.title}
                            </span>
                            <span className="text-xs font-black text-slate-900 line-clamp-2 leading-tight">
                              Lec {lecture.order_number} : {lecture.title.split(":")[0]}
                            </span>
                          </div>

                          <div className="relative z-10 text-[11px] font-bold text-slate-600 mt-2">
                            By Sachin Sir
                          </div>

                          {/* Decorative Avatar / Watermark Graphic */}
                          <div className="absolute right-2 bottom-0 w-24 h-24 bg-gradient-to-t from-blue-600/30 to-purple-600/20 rounded-full blur-sm flex items-center justify-center text-3xl font-black text-blue-900/40 pointer-events-none">
                            ⚛️
                          </div>
                        </div>
                      )}

                      {/* Top Right Checkmark Badge */}
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Check className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Center/Right Play Button Overlay */}
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-950/80 group-hover:scale-110 transition-all border border-white/30">
                        <Play className="w-4 h-4 ml-0.5 fill-white" />
                      </div>

                      {/* Lecture Order Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300">
                        Lec {lecture.order_number}
                      </div>
                    </div>

                    {/* ── Metadata Strip (Date & Duration) ───────────── */}
                    <div className="px-4 py-2 bg-[#090a0f] border-b border-white/5 flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{formatDate(lecture.created_at)}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDuration(lecture.duration_mins)}
                      </span>
                    </div>

                    {/* ── Lecture Title Section ────────────────────────── */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                        {lecture.title}
                      </h3>

                      {lecture.description && (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-1">
                          {lecture.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 glass rounded-3xl border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Lectures Uploaded Yet</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Video lectures for <span className="text-white font-medium">{chapter.title}</span> will be uploaded soon.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: NOTES ─────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {notesMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {notesMaterials.map((m) => (
                <div
                  key={m.id}
                  className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      <p className="text-slate-400 text-xs uppercase tracking-wider">PDF Document</p>
                    </div>
                  </div>

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border border-white/10">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">No Notes Uploaded</h4>
              <p className="text-slate-400 text-xs">PDF notes for this chapter will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: DPP QUIZ ──────────────────────────────────── */}
      {activeTab === "dpp_quiz" && (
        <div className="space-y-4">
          {dppQuizMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dppQuizMaterials.map((m) => (
                <div
                  key={m.id}
                  className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      <p className="text-slate-400 text-xs">Interactive DPP Quiz</p>
                    </div>
                  </div>

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    Start Quiz
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border border-white/10">
              <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">No DPP Quizzes Yet</h4>
              <p className="text-slate-400 text-xs">Interactive DPP quizzes for this chapter will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: DPP PDF ───────────────────────────────────── */}
      {activeTab === "dpp_pdf" && (
        <div className="space-y-4">
          {dppPdfMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dppPdfMaterials.map((m) => (
                <div
                  key={m.id}
                  className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      <p className="text-slate-400 text-xs">DPP Problem Sheet PDF</p>
                    </div>
                  </div>

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border border-white/10">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">No DPP PDFs Uploaded</h4>
              <p className="text-slate-400 text-xs">Daily Practice Problem (DPP) PDFs will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: DPP VIDEO ─────────────────────────────────── */}
      {activeTab === "dpp_video" && (
        <div className="space-y-4">
          {dppVideoMaterials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dppVideoMaterials.map((m) => (
                <div
                  key={m.id}
                  className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      <p className="text-slate-400 text-xs">DPP Solution Video</p>
                    </div>
                  </div>

                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white" /> Watch Solution
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass rounded-3xl border border-white/10">
              <Video className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">No DPP Solution Videos Yet</h4>
              <p className="text-slate-400 text-xs">Video solutions for DPPs will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
