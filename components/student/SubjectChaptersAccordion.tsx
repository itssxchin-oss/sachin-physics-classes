"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, Video } from "lucide-react";
import type { Chapter, Lecture } from "@/lib/database.types";

interface SubjectChaptersAccordionProps {
  batchId: string;
  subjectTitle: string;
  subjectId?: string;
  chapters: Chapter[];
  lectures: Lecture[];
  completedLectureIds: string[];
}

export default function SubjectChaptersAccordion({
  batchId,
  subjectTitle,
  chapters,
  lectures,
}: SubjectChaptersAccordionProps) {
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
        const chapterLectures = lectures.filter((l) => l.chapter_id === chapter.id);
        const chapterSubjectId = chapter.subject_id;
        const chapterHref = chapterSubjectId
          ? `/batches/${batchId}/subjects/${chapterSubjectId}/chapters/${chapter.id}`
          : `#`;

        return (
          <Link
            key={chapter.id}
            href={chapterHref}
            className="group glass rounded-2xl border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:border-blue-500/50 hover:bg-white/[0.04] card-hover block"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-sm flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                Ch {chapter.order_number || index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-extrabold text-white text-base sm:text-lg truncate group-hover:text-blue-300 transition-colors">
                    {chapter.title}
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1 flex-shrink-0">
                    <Video className="w-3 h-3" />
                    {chapterLectures.length} {chapterLectures.length === 1 ? "Lecture" : "Lectures"}
                  </span>
                </div>

                {chapter.description ? (
                  <p className="text-slate-400 text-xs sm:text-sm line-clamp-1">
                    {chapter.description}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs">Click to view chapter lectures & study materials</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
              <span className="px-4 py-2.5 rounded-xl bg-blue-600/20 group-hover:bg-blue-600 text-blue-300 group-hover:text-white border border-blue-500/30 font-bold text-xs flex items-center gap-2 transition-all shadow-sm">
                <span>Open Chapter Page</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
