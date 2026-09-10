"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, CheckCircle2, Video, Clock, BookOpen } from "lucide-react";
import type { Chapter, Lecture } from "@/lib/database.types";

interface SubjectChaptersAccordionProps {
  batchId: string;
  subjectTitle: string;
  chapters: Chapter[];
  lectures: Lecture[];
  completedLectureIds: string[];
}

export default function SubjectChaptersAccordion({
  batchId,
  subjectTitle,
  chapters,
  lectures,
  completedLectureIds,
}: SubjectChaptersAccordionProps) {
  // Open first chapter by default
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (chapters.length > 0) {
      initial[chapters[0].id] = true;
    }
    return initial;
  });

  const toggleChapter = (chapterId: string) => {
    setExpandedChapterIds((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const completedSet = new Set(completedLectureIds);

  if (chapters.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-3xl border border-white/10 fade-up">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Chapters Added Yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Chapters and video lectures for <span className="text-white font-medium">{subjectTitle}</span> will be uploaded soon by your instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-up">
      {chapters.map((chapter, index) => {
        const isExpanded = !!expandedChapterIds[chapter.id];
        const chapterLectures = lectures.filter((l) => l.chapter_id === chapter.id);

        return (
          <div
            key={chapter.id}
            className="glass rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-blue-500/30"
          >
            {/* Chapter Header */}
            <button
              type="button"
              onClick={() => toggleChapter(chapter.id)}
              className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-sm flex-shrink-0 shadow-inner">
                  Ch {chapter.order_number || index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-white text-base sm:text-lg truncate">
                    {chapter.title}
                  </h3>

                  {chapter.description && (
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-1 mt-0.5">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>

            {/* Chapter Body (Expanded) */}
            {isExpanded && (
              <div className="border-t border-white/10 p-5 sm:p-6 bg-slate-950/60">
                {chapterLectures.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chapterLectures.map((lecture) => {
                      const isCompleted = completedSet.has(lecture.id);

                      return (
                        <Link
                          key={lecture.id}
                          href={`/lecture/${lecture.id}`}
                          className="group glass rounded-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-300 flex flex-col overflow-hidden card-hover"
                        >
                          {/* Lecture Card Thumbnail Visual Header */}
                          <div className="relative aspect-video w-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950/40 flex items-center justify-center overflow-hidden border-b border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                            {/* Background subtle glow & pattern */}
                            <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors" />
                            <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                            
                            {/* Central Play Badge */}
                            <div className="relative w-12 h-12 rounded-full bg-blue-600/80 group-hover:bg-blue-500 group-hover:scale-110 text-white flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-950/50 border border-white/20">
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                              ) : (
                                <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
                              )}
                            </div>

                            {/* Lecture number badge */}
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-cyan-300">
                              Lecture #{lecture.order_number}
                            </div>

                            {/* Duration badge */}
                            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{lecture.duration_mins || 45} mins</span>
                            </div>

                            {/* Completed Badge */}
                            {isCompleted && (
                              <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1">
                                ✓ Completed
                              </div>
                            )}
                          </div>

                          {/* Lecture Card Info */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-blue-300 transition-colors line-clamp-2">
                                {lecture.title}
                              </h4>
                              {lecture.description && (
                                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                                  {lecture.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Video className="w-3.5 h-3.5 text-blue-400" />
                                Watch Video
                              </span>
                              <span className="font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                                Start <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 glass rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400">No lectures uploaded in this chapter yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
