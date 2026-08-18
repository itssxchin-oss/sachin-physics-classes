"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Play, CheckCircle2 } from "lucide-react";
import type { Chapter, Lecture } from "@/lib/database.types";

interface StudentCourseAccordionProps {
  courseId: string;
  chapters: Chapter[];
  lectures: Lecture[];
  completedLectureIds: string[];
}

export default function StudentCourseAccordion({
  courseId,
  chapters,
  lectures,
  completedLectureIds,
}: StudentCourseAccordionProps) {
  // Expand first chapter by default if available
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

  // If no chapters exist for this course
  if (chapters.length === 0) {
    const unassignedLectures = lectures;

    if (unassignedLectures.length === 0) {
      return (
        <div className="text-center py-16 glass rounded-3xl border border-white/10 fade-up">
          <span className="text-5xl block mb-4">📚</span>
          <h3 className="text-xl font-bold text-white mb-2">No chapters available yet</h3>
          <p className="text-slate-400 text-sm">
            Chapters and lectures will appear here once the teacher publishes them.
          </p>
        </div>
      );
    }

    // Direct lectures list if no chapters created yet
    return (
      <div className="space-y-4 fade-up">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
          Course Lectures
        </h3>
        {unassignedLectures.map((lecture) => {
          const isCompleted = completedSet.has(lecture.id);

          return (
            <Link
              key={lecture.id}
              href={`/courses/${courseId}/lecture/${lecture.id}`}
              className="group glass p-5 rounded-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-hover"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Play className="w-5 h-5 text-blue-400 ml-0.5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Lecture #{lecture.order_number}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Completed
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                    {lecture.title}
                  </h4>
                  {lecture.description && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-1">
                      {lecture.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                <span className="text-xs text-slate-400 font-medium">
                  ⏱️ {lecture.duration_mins || 45} mins
                </span>
                <span className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md group-hover:shadow-blue-500/20 flex items-center gap-1.5">
                  <span>Watch</span>
                  <span>→</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // Render chapters accordion
  return (
    <div className="space-y-4 fade-up">
      {chapters.map((chapter) => {
        const isExpanded = !!expandedChapterIds[chapter.id];
        const chapterLectures = lectures.filter((l) => l.chapter_id === chapter.id);
        const completedCount = chapterLectures.filter((l) => completedSet.has(l.id)).length;
        const totalCount = chapterLectures.length;
        const isChapterFullyCompleted = totalCount > 0 && completedCount === totalCount;

        return (
          <div
            key={chapter.id}
            className="glass rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-blue-500/30"
          >
            {/* Chapter Header Bar */}
            <button
              type="button"
              onClick={() => toggleChapter(chapter.id)}
              className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0 mt-0.5 sm:mt-0">
                  #{chapter.order_number}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-extrabold text-white text-base sm:text-lg">
                      {chapter.title}
                    </h3>
                  </div>

                  {chapter.description && (
                    <p className="text-slate-300 text-xs sm:text-sm line-clamp-2 mb-2">
                      {chapter.description}
                    </p>
                  )}

                  {/* Mini chapter progress bar */}
                  {totalCount > 0 && (
                    <div className="mt-1.5">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isChapterFullyCompleted
                              ? "bg-gradient-to-r from-emerald-500 to-green-400"
                              : "bg-gradient-to-r from-blue-600 to-cyan-400"
                          }`}
                          style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Progress indicator & Chevron */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                      isChapterFullyCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : completedCount > 0
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-slate-800 text-slate-400 border-white/10"
                    }`}
                  >
                    {totalCount === 0
                      ? "0 lectures"
                      : `${completedCount}/${totalCount} completed`}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </button>

            {/* Chapter Body (Expanded) */}
            {isExpanded && (
              <div className="border-t border-white/10 p-4 sm:p-6 bg-slate-950/40 space-y-3">
                {chapterLectures.length > 0 ? (
                  chapterLectures.map((lecture) => {
                    const isCompleted = completedSet.has(lecture.id);

                    return (
                      <Link
                        key={lecture.id}
                        href={`/courses/${courseId}/lecture/${lecture.id}`}
                        className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Play className="w-4 h-4 text-blue-400 ml-0.5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                                Lecture #{lecture.order_number}
                              </span>
                              {isCompleted && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Done
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-blue-300 transition-colors">
                              {lecture.title}
                            </h4>
                            {lecture.description && (
                              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                                {lecture.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                          <span className="text-xs text-slate-400 font-medium">
                            ⏱️ {lecture.duration_mins || 45} mins
                          </span>
                          <span className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md group-hover:shadow-blue-500/20 flex items-center gap-1">
                            <span>Watch</span>
                            <span>→</span>
                          </span>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="text-center py-6 glass rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400">No lectures added yet</p>
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
