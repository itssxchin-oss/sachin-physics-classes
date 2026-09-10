"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Play, FolderPlus, Video, BookOpen, Layers } from "lucide-react";
import DeleteBatchButton from "@/components/ui/DeleteBatchButton";
import DeleteSubjectButton from "@/components/ui/DeleteSubjectButton";
import DeleteChapterButton from "@/components/ui/DeleteChapterButton";
import DeleteLectureButton from "@/components/ui/DeleteLectureButton";

export interface BatchItem {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string | null;
  price?: number;
  created_at?: string;
}

export interface SubjectItem {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  order_number: number;
}

export interface ChapterItem {
  id: string;
  subject_id?: string | null;
  course_id?: string | null;
  title: string;
  description: string;
  order_number: number;
}

export interface LectureItem {
  id: string;
  chapter_id?: string | null;
  course_id?: string | null;
  title: string;
  description: string;
  youtube_url: string;
  order_number: number;
  duration_mins?: number | null;
}

interface TeacherBatchAccordionProps {
  batches: BatchItem[];
  subjects: SubjectItem[];
  chapters: ChapterItem[];
  lectures: LectureItem[];
}

export default function TeacherBatchAccordion({
  batches,
  subjects,
  chapters,
  lectures,
}: TeacherBatchAccordionProps) {
  // Track expanded state for Batches and Subjects
  const [expandedBatchIds, setExpandedBatchIds] = useState<Record<string, boolean>>({});
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({});

  const toggleBatch = (batchId: string) => {
    setExpandedBatchIds((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjectIds((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 glass rounded-2xl border border-white/10">
        <span className="text-5xl block mb-4">📦</span>
        <h3 className="text-lg font-semibold text-white mb-2">No batches created yet</h3>
        <p className="text-slate-400 mb-4">Create your first physics batch to get started.</p>
        <Link
          href="/teacher/batches/new"
          className="inline-block px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all"
        >
          ＋ Add New Batch
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((b) => {
        const isBatchExpanded = !!expandedBatchIds[b.id];
        const batchSubjects = subjects.filter((s) => s.batch_id === b.id);
        const batchSubjectIds = new Set(batchSubjects.map((s) => s.id));
        const batchChapters = chapters.filter((ch) => ch.subject_id && batchSubjectIds.has(ch.subject_id));
        const batchChapterIds = new Set(batchChapters.map((ch) => ch.id));
        const batchLectures = lectures.filter((l) => l.chapter_id && batchChapterIds.has(l.chapter_id));

        return (
          <div
            key={b.id}
            className="glass rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-purple-500/30"
          >
            {/* Level 1: Batch Header Bar */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleBatch(b.id)}
              >
                <button
                  type="button"
                  aria-label={isBatchExpanded ? "Collapse batch" : "Expand batch"}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  {isBatchExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      Batch • {b.price && b.price > 0 ? `₹${b.price}` : "Free"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      📘 {batchSubjects.length} subject{batchSubjects.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      📂 {batchChapters.length} chapter{batchChapters.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      📹 {batchLectures.length} lecture{batchLectures.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base hover:text-purple-300 transition-colors">
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{b.description}</p>
                  )}
                </div>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleBatch(b.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1"
                >
                  {isBatchExpanded ? "Hide Hierarchy" : "View Hierarchy"}
                </button>

                <Link
                  href={`/teacher/subjects/new?batch_id=${b.id}`}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" /> ＋ Add Subject
                </Link>

                <Link
                  href={`/teacher/batches/${b.id}/edit`}
                  aria-label={`Edit batch ${b.title}`}
                  title="Edit batch"
                  className="w-8 h-8 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 flex items-center justify-center transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </Link>

                <DeleteBatchButton batchId={b.id} batchTitle={b.title} />
              </div>
            </div>

            {/* Level 1 Expanded: Subjects List */}
            {isBatchExpanded && (
              <div className="border-t border-white/10 p-5 bg-slate-950/40 space-y-6 fade-up">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Batch Hierarchy (Subjects → Chapters → Lectures)</span>
                  </h4>
                  <Link
                    href={`/teacher/subjects/new?batch_id=${b.id}`}
                    className="px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> ＋ Add Subject
                  </Link>
                </div>

                {batchSubjects.length > 0 ? (
                  <div className="space-y-4">
                    {batchSubjects.map((sub) => {
                      const isSubjectExpanded = expandedSubjectIds[sub.id] !== false; // expanded by default or togglable
                      const subjectChapters = chapters.filter((ch) => ch.subject_id === sub.id);

                      return (
                        <div
                          key={sub.id}
                          className="glass p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 space-y-4"
                        >
                          {/* Level 2: Subject Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div
                              className="flex items-center gap-3 cursor-pointer flex-1"
                              onClick={() => toggleSubject(sub.id)}
                            >
                              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                                #{sub.order_number}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                                  <span>📘 {sub.title}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    ({subjectChapters.length} chapter{subjectChapters.length !== 1 ? "s" : ""})
                                  </span>
                                </h5>
                                {sub.description && (
                                  <p className="text-xs text-slate-400 mt-0.5">{sub.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Subject Action Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/teacher/chapters/new?batch_id=${b.id}&subject_id=${sub.id}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                              >
                                <FolderPlus className="w-3 h-3" /> ＋ Add Chapter
                              </Link>
                              <Link
                                href={`/teacher/subjects/${sub.id}/edit`}
                                aria-label={`Edit subject ${sub.title}`}
                                title="Edit subject"
                                className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 flex items-center justify-center transition-all"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                              <DeleteSubjectButton subjectId={sub.id} subjectTitle={sub.title} />
                            </div>
                          </div>

                          {/* Level 2 Expanded: Chapters List */}
                          {isSubjectExpanded && (
                            <div className="pl-2 sm:pl-4 border-l-2 border-cyan-500/20 space-y-3 pt-1">
                              {subjectChapters.length > 0 ? (
                                subjectChapters.map((ch) => {
                                  const chapterLectures = lectures.filter((l) => l.chapter_id === ch.id);

                                  return (
                                    <div
                                      key={ch.id}
                                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3"
                                    >
                                      {/* Level 3: Chapter Header */}
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                          <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center justify-center">
                                            #{ch.order_number}
                                          </span>
                                          <div>
                                            <h6 className="font-bold text-white text-xs flex items-center gap-2">
                                              <span>📂 {ch.title}</span>
                                              <span className="text-[10px] text-slate-400 font-normal">
                                                ({chapterLectures.length} lecture{chapterLectures.length !== 1 ? "s" : ""})
                                              </span>
                                            </h6>
                                            {ch.description && (
                                              <p className="text-[11px] text-slate-400 mt-0.5">
                                                {ch.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Chapter Action Buttons */}
                                        <div className="flex items-center gap-1.5">
                                          <Link
                                            href={`/teacher/lectures/new?subject_id=${sub.id}&chapter_id=${ch.id}`}
                                            className="px-2 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                                          >
                                            <Video className="w-3 h-3" /> ＋ Lecture
                                          </Link>
                                          <Link
                                            href={`/teacher/chapters/${ch.id}/edit`}
                                            aria-label={`Edit chapter ${ch.title}`}
                                            title="Edit chapter"
                                            className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </Link>
                                          <DeleteChapterButton chapterId={ch.id} chapterTitle={ch.title} />
                                        </div>
                                      </div>

                                      {/* Level 4: Lectures under Chapter */}
                                      <div className="pl-3 sm:pl-6 border-l-2 border-emerald-500/20 space-y-2 pt-1">
                                        {chapterLectures.length > 0 ? (
                                          chapterLectures.map((lec) => (
                                            <div
                                              key={lec.id}
                                              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-colors"
                                            >
                                              <div className="flex items-center gap-2.5">
                                                <a
                                                  href={lec.youtube_url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  aria-label={`Play lecture ${lec.title}`}
                                                  title="Watch lecture"
                                                  className="w-6 h-6 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0 transition-all hover:scale-105"
                                                >
                                                  <Play className="w-3 h-3 ml-0.5" />
                                                </a>
                                                <div>
                                                  <span className="text-[10px] text-indigo-400 font-semibold uppercase mr-1.5">
                                                    Lec {lec.order_number}
                                                  </span>
                                                  <span className="text-xs font-semibold text-white">
                                                    {lec.title}
                                                  </span>
                                                  {lec.duration_mins && (
                                                    <span className="text-[10px] text-slate-400 ml-2">
                                                      ⏱️ {lec.duration_mins}m
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Lecture Action Buttons */}
                                              <div className="flex items-center gap-1.5">
                                                <Link
                                                  href={`/teacher/lectures/${lec.id}/materials`}
                                                  aria-label={`Materials for lecture ${lec.title}`}
                                                  title="Lecture materials"
                                                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 text-[11px] font-medium transition-all"
                                                >
                                                  📎 Materials
                                                </Link>
                                                <Link
                                                  href={`/teacher/lectures/${lec.id}/edit`}
                                                  aria-label={`Edit lecture ${lec.title}`}
                                                  title="Edit lecture"
                                                  className="w-6 h-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center justify-center transition-all"
                                                >
                                                  <Pencil className="w-2.5 h-2.5" />
                                                </Link>
                                                <DeleteLectureButton lectureId={lec.id} lectureTitle={lec.title} />
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="py-1 text-xs text-slate-500 italic">
                                            No lectures added to this chapter yet.{" "}
                                            <Link
                                              href={`/teacher/lectures/new?subject_id=${sub.id}&chapter_id=${ch.id}`}
                                              className="text-indigo-400 hover:underline not-italic font-medium"
                                            >
                                              ＋ Add Lecture
                                            </Link>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-4 glass rounded-xl border border-white/5">
                                  <p className="text-xs text-slate-400 mb-1.5">No chapters created for this subject yet.</p>
                                  <Link
                                    href={`/teacher/chapters/new?batch_id=${b.id}&subject_id=${sub.id}`}
                                    className="inline-block px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
                                  >
                                    ＋ Add First Chapter
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 glass rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 mb-2">No subjects created for this batch yet.</p>
                    <Link
                      href={`/teacher/subjects/new?batch_id=${b.id}`}
                      className="inline-block px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                    >
                      ＋ Add First Subject
                    </Link>
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
